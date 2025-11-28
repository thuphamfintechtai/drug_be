import { TransferToPharmacyDTO } from "../dto/TransferToPharmacyDTO.js";
import { CommercialInvoice } from "../../domain/aggregates/CommercialInvoice.js";
import { DrugNotFoundException } from "../../../supply-chain/domain/exceptions/DrugNotFoundException.js";
import crypto from "crypto";

export class TransferToPharmacyUseCase {
  constructor(
    drugInfoRepository,
    nftRepository,
    commercialInvoiceRepository,
    eventBus
  ) {
    this._drugInfoRepository = drugInfoRepository;
    this._nftRepository = nftRepository;
    this._commercialInvoiceRepository = commercialInvoiceRepository;
    this._eventBus = eventBus;
  }

  async execute(
    distributorId,
    pharmacyId,
    drugId,
    tokenIds,
    invoiceNumber = null,
    invoiceDate = null,
    quantity = null,
    unitPrice = null,
    totalAmount = null,
    vatRate = null,
    vatAmount = null,
    finalAmount = null,
    notes = null
  ) {
    // Validate tokenIds is array and not empty
    if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
      throw new Error("tokenIds phải là array không rỗng");
    }

    // Check for duplicate tokenIds
    const uniqueTokenIds = [...new Set(tokenIds)];
    if (uniqueTokenIds.length !== tokenIds.length) {
      throw new Error("tokenIds không được chứa giá trị trùng lặp");
    }

    // Check drug exists
    const drug = await this._drugInfoRepository.findById(drugId);
    if (!drug) {
      throw new DrugNotFoundException(`Thuốc với ID ${drugId} không tồn tại`);
    }

    // Check NFTs exist and belong to distributor
    const nfts = await this._nftRepository.findByTokenIds(tokenIds);
    if (nfts.length !== tokenIds.length) {
      const foundTokenIds = nfts.map(nft => nft.tokenId);
      const missingTokenIds = tokenIds.filter(tid => !foundTokenIds.includes(tid));
      throw new Error(`Không tìm thấy một số tokenId: ${missingTokenIds.join(", ")}`);
    }

    // Normalize distributorId to string for comparison
    const normalizedDistributorId = distributorId ? String(distributorId).trim() : null;

    // Check if NFTs have already been transferred (possibly by blockchain event)
    const alreadyTransferredNFTs = [];
    for (const nft of nfts) {
      // Normalize ownerId to string for comparison
      const normalizedOwnerId = nft.ownerId ? String(nft.ownerId).trim() : null;
      
      if (normalizedOwnerId !== normalizedDistributorId) {
        // NFT has been transferred - check if there's an existing invoice
        alreadyTransferredNFTs.push({
          tokenId: nft.tokenId,
          currentOwner: normalizedOwnerId,
          status: nft.status
        });
      }
    }

    // If some NFTs have been transferred, check for existing invoice
    if (alreadyTransferredNFTs.length > 0) {
      // Try to find existing invoice with these tokenIds
      const existingInvoices = await this._commercialInvoiceRepository.findByDistributor(distributorId, {});
      const matchingInvoice = existingInvoices.find(inv => {
        const invoiceTokenIds = (inv.tokenIds || []).map(id => String(id).trim());
        const requestTokenIds = tokenIds.map(id => String(id).trim());
        return requestTokenIds.every(tid => invoiceTokenIds.includes(tid));
      });

      if (matchingInvoice) {
        // Return existing invoice (idempotency)
        return {
          invoiceId: matchingInvoice.id,
          invoiceNumber: matchingInvoice.invoiceNumber,
          status: matchingInvoice.status,
          tokenIds: matchingInvoice.tokenIds,
          quantity: matchingInvoice.quantity,
          createdAt: matchingInvoice.createdAt,
          message: "Invoice đã tồn tại cho các tokenIds này (có thể đã được tạo bởi blockchain event)"
        };
      }

      // NFT has been transferred but no invoice found
      const transferredTokenIds = alreadyTransferredNFTs.map(nft => nft.tokenId).join(", ");
      throw new Error(
        `Các NFT sau đã được transfer (có thể bởi blockchain event): ${transferredTokenIds}. ` +
        `Owner hiện tại của NFT đầu tiên: ${alreadyTransferredNFTs[0].currentOwner || 'null'}, ` +
        `Distributor ID: ${normalizedDistributorId || 'null'}. ` +
        `Vui lòng kiểm tra lại hoặc đợi blockchain event xử lý xong trước khi tạo invoice.`
      );
    }

    // Validate all NFTs belong to distributor and can be transferred
    for (const nft of nfts) { 

      if (!nft.canBeTransferred()) {
        throw new Error(`NFT với tokenId ${nft.tokenId} không thể chuyển giao (status: ${nft.status})`);
      }

      // Normalize drugId for comparison
      const normalizedNftDrugId = nft.drugId ? String(nft.drugId).trim() : null;
      const normalizedDrugId = drugId ? String(drugId).trim() : null;
      
      if (normalizedNftDrugId !== normalizedDrugId) {
        throw new Error(`NFT với tokenId ${nft.tokenId} không thuộc về thuốc này`);
      }
    }

    // Calculate quantity if not provided
    const calculatedQuantity = quantity || nfts.length;

    // Validate quantity matches tokenIds length if provided
    if (quantity !== null && quantity !== undefined && quantity !== nfts.length) {
      throw new Error(`quantity (${quantity}) phải bằng số lượng tokenIds (${nfts.length})`);
    }

    // Get nftInfoId from first NFT
    const nftInfoId = nfts[0]?.id || null;

    // Generate invoice number if not provided
    const finalInvoiceNumber = invoiceNumber || `INV-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;

    // Use MongoDB transaction to ensure atomicity and prevent duplicate
    const mongoose = await import("mongoose");
    const session = await mongoose.default.startSession();
    
    try {
      let savedInvoice;
      let invoiceAggregate = null; // Store aggregate to access domain events
      
      await session.withTransaction(async () => {
        // Check for existing invoice WITHIN transaction to prevent race condition
        const existingInvoice = await this._commercialInvoiceRepository.findByTokenIds(
          distributorId,
          pharmacyId,
          drugId,
          tokenIds
        );

        // Chỉ return invoice cũ nếu nó ở trạng thái draft hoặc issued (chưa sent)
        if (existingInvoice && (existingInvoice.status === "draft" || existingInvoice.status === "issued")) {
          // Invoice đã tồn tại, return nó
          savedInvoice = existingInvoice;
          return; // Early return, không tạo mới
        }

        // Create commercial invoice
        invoiceAggregate = CommercialInvoice.create(
          distributorId,
          pharmacyId,
          drugId,
          finalInvoiceNumber,
          calculatedQuantity,
          tokenIds,
          invoiceDate,
          null, // proofOfPharmacyId - will be set later
          nftInfoId,
          unitPrice,
          totalAmount,
          vatRate,
          vatAmount,
          finalAmount,
          notes
        );

        invoiceAggregate.issue(); // Automatically issue the invoice

        // Save within transaction
        savedInvoice = await this._commercialInvoiceRepository.save(invoiceAggregate, { session });
      });
      
      // If invoice already existed, return it
      if (savedInvoice && savedInvoice.id) {
        // Check if this is the existing invoice (by checking if it was just created)
        const checkInvoice = await this._commercialInvoiceRepository.findById(savedInvoice.id);
        if (checkInvoice && (checkInvoice.status === "draft" || checkInvoice.status === "issued")) {
          // This might be an existing invoice, double check by tokenIds
          const invoiceTokenIds = (checkInvoice.tokenIds || []).map(id => String(id).trim()).sort();
          const requestTokenIds = tokenIds.map(id => String(id).trim()).sort();
          
          if (invoiceTokenIds.length === requestTokenIds.length &&
              invoiceTokenIds.every((tid, idx) => tid === requestTokenIds[idx])) {
            // This is the existing invoice
            return {
              invoiceId: checkInvoice.id,
              invoiceNumber: checkInvoice.invoiceNumber,
              status: checkInvoice.status,
              tokenIds: checkInvoice.tokenIds,
              quantity: checkInvoice.quantity,
              createdAt: checkInvoice.createdAt,
              message: "Invoice đã tồn tại cho các tokenIds này (idempotency check)"
            };
          }
        }
      }
      
      // Publish domain events AFTER transaction commits (only if new invoice was created)
      if (invoiceAggregate && invoiceAggregate.domainEvents && invoiceAggregate.domainEvents.length > 0) {
        invoiceAggregate.domainEvents.forEach(event => {
          this._eventBus.publish(event);
        });
      }
      
      return {
        invoiceId: savedInvoice.id,
        invoiceNumber: savedInvoice.invoiceNumber,
        status: savedInvoice.status,
        tokenIds: savedInvoice.tokenIds,
        quantity: savedInvoice.quantity,
        createdAt: savedInvoice.createdAt,
      };
    } finally {
      await session.endSession();
    }

    // Publish domain events
    invoice.domainEvents.forEach(event => {
      this._eventBus.publish(event);
    });

    // Return saved invoice with ObjectId from database (not UUID from domain entity)
    return {
      invoiceId: savedInvoice.id, // This is now ObjectId from MongoDB
      invoiceNumber: savedInvoice.invoiceNumber,
      status: savedInvoice.status,
      tokenIds: savedInvoice.tokenIds,
      quantity: savedInvoice.quantity,
      createdAt: savedInvoice.createdAt,
    };
  }
}

