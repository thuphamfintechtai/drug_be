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

    // Validate all NFTs belong to distributor and can be transferred
    for (const nft of nfts) {
      if (nft.ownerId !== distributorId) {
        throw new Error(`NFT với tokenId ${nft.tokenId} không thuộc về distributor này`);
      }

      if (!nft.canBeTransferred()) {
        throw new Error(`NFT với tokenId ${nft.tokenId} không thể chuyển giao (status: ${nft.status})`);
      }

      if (nft.drugId !== drugId) {
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

    // Create commercial invoice
    const invoice = CommercialInvoice.create(
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

    invoice.issue(); // Automatically issue the invoice

    await this._commercialInvoiceRepository.save(invoice);

    // Publish domain events
    invoice.domainEvents.forEach(event => {
      this._eventBus.publish(event);
    });

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      tokenIds: invoice.tokenIds,
      quantity: invoice.quantity,
      createdAt: invoice.createdAt,
    };
  }
}

