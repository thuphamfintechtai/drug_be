import { TransferToPharmacyDTO } from "../dto/TransferToPharmacyDTO.js";
import { CommercialInvoice } from "../../domain/aggregates/CommercialInvoice.js";
import { DrugNotFoundException } from "../../../supply-chain/domain/exceptions/DrugNotFoundException.js";
import crypto from "crypto";

export class TransferToPharmacyUseCase {
  constructor(
    drugInfoRepository,
    nftRepository,
    commercialInvoiceRepository,
    manufacturerInvoiceRepository,
    eventBus
  ) {
    this._drugInfoRepository = drugInfoRepository;
    this._nftRepository = nftRepository;
    this._commercialInvoiceRepository = commercialInvoiceRepository;
    this._manufacturerInvoiceRepository = manufacturerInvoiceRepository;
    this._eventBus = eventBus;
  }

  async execute(
    distributorId,
    pharmacyId,
    drugId,
    amount,
    tokenIds = null,
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
    // Check drug exists
    const drug = await this._drugInfoRepository.findById(drugId);
    if (!drug) {
      throw new DrugNotFoundException(`Thuốc với ID ${drugId} không tồn tại`);
    }

    let selectedTokenIds = [];

    // Nếu FE gửi tokenIds, dùng tokenIds đó; nếu không, tự động chọn theo index
    if (tokenIds && Array.isArray(tokenIds) && tokenIds.length > 0) {
      // FE đã gửi tokenIds, dùng tokenIds đó
      selectedTokenIds = tokenIds.map(id => String(id).trim());
      
      // Validate amount phải bằng số lượng tokenIds
      if (amount && amount !== selectedTokenIds.length) {
        throw new Error(`amount (${amount}) phải bằng số lượng tokenIds (${selectedTokenIds.length})`);
      }
      
      // Set amount = số lượng tokenIds nếu không có
      if (!amount) {
        amount = selectedTokenIds.length;
      }
    } else {
      // FE không gửi tokenIds, tự động chọn theo index
      if (!amount || amount <= 0 || !Number.isInteger(amount)) {
        throw new Error("amount phải là số nguyên dương (hoặc cung cấp tokenIds)");
      }

      // Query manufacturerInvoice để lấy tất cả tokenIds mà distributor đã nhận từ manufacturer
      const manufacturerInvoices = await this._manufacturerInvoiceRepository.findByDistributor(distributorId, {
        status: "sent" // Chỉ lấy các invoice đã được gửi (NFTs đã được transfer)
      });

      // Lọc theo drugId và gộp tất cả tokenIds lại
      // Lưu ý: Cần sort invoices theo createdAt để đảm bảo thứ tự đúng (invoice cũ trước, mới sau)
      const allTokenIds = [];
      for (const invoice of manufacturerInvoices) {
        const normalizedInvoiceDrugId = invoice.drugId ? String(invoice.drugId).trim() : null;
        const normalizedDrugId = drugId ? String(drugId).trim() : null;
        
        if (normalizedInvoiceDrugId === normalizedDrugId && invoice.tokenIds && Array.isArray(invoice.tokenIds)) {
          // Sort tokenIds trong mỗi invoice trước khi thêm vào allTokenIds
          const sortedInvoiceTokenIds = invoice.tokenIds.map(id => String(id).trim()).sort((a, b) => {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            if (isNaN(numA) || isNaN(numB)) {
              return a.localeCompare(b);
            }
            return numA - numB;
          });
          allTokenIds.push(...sortedInvoiceTokenIds);
        }
      }

      // Loại bỏ duplicate tokenIds (nếu có) - giữ lại tokenId đầu tiên xuất hiện
      const seenTokenIds = new Set();
      const uniqueTokenIds = [];
      for (const tokenId of allTokenIds) {
        if (!seenTokenIds.has(tokenId)) {
          seenTokenIds.add(tokenId);
          uniqueTokenIds.push(tokenId);
        }
      }
      
      // Sort lại toàn bộ tokenIds theo số để đảm bảo thứ tự đúng (không sort theo string)
      uniqueTokenIds.sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (isNaN(numA) || isNaN(numB)) {
          // Nếu không phải số, sort theo string
          return a.localeCompare(b);
        }
        return numA - numB;
      });

      if (uniqueTokenIds.length === 0) {
        throw new Error(`Distributor chưa nhận NFT nào từ manufacturer cho drug ${drugId}`);
      }

      // Query commercialInvoice để tính số lượng tokenIds đã chuyển cho pharmacy này
      const transferredCount = await this._commercialInvoiceRepository.countTransferredTokenIds(
        distributorId,
        pharmacyId,
        drugId
      );

      // Tính index bắt đầu
      const startIndex = transferredCount;
      const endIndex = startIndex + amount;

      // Kiểm tra xem có đủ NFT để chuyển không
      if (endIndex > uniqueTokenIds.length) {
        const available = uniqueTokenIds.length - startIndex;
        throw new Error(
          `Không đủ NFT để chuyển. ` +
          `Đã chuyển: ${transferredCount}, ` +
          `Tổng số NFT nhận được: ${uniqueTokenIds.length}, ` +
          `Còn lại: ${available}, ` +
          `Yêu cầu: ${amount}`
        );
      }

      // Lấy amount NFT tiếp theo từ mảng tokenIds (theo index)
      selectedTokenIds = uniqueTokenIds.slice(startIndex, endIndex);
      
      console.log("TransferToPharmacy - Auto TokenIds selection:", {
        distributorId,
        pharmacyId,
        drugId,
        amount,
        totalReceived: uniqueTokenIds.length,
        transferredCount,
        startIndex,
        endIndex,
        selectedTokenIds,
      });
    }

    // Validate NFTs exist and belong to distributor
    const nfts = await this._nftRepository.findByTokenIds(selectedTokenIds);
    if (nfts.length !== selectedTokenIds.length) {
      const foundTokenIds = nfts.map(nft => nft.tokenId);
      const missingTokenIds = selectedTokenIds.filter(tid => !foundTokenIds.includes(String(tid)));
      throw new Error(`Không tìm thấy một số tokenId: ${missingTokenIds.join(", ")}`);
    }

    // Normalize distributorId to string for comparison
    const normalizedDistributorId = distributorId ? String(distributorId).trim() : null;

    // Validate all NFTs belong to distributor and can be transferred
    for (const nft of nfts) {
      // Normalize ownerId to string for comparison
      const normalizedOwnerId = nft.ownerId ? String(nft.ownerId).trim() : null;
      
      if (normalizedOwnerId !== normalizedDistributorId) {
        throw new Error(
          `NFT với tokenId ${nft.tokenId} không thuộc về distributor. ` +
          `Owner hiện tại: ${normalizedOwnerId || 'null'}, ` +
          `Distributor ID: ${normalizedDistributorId || 'null'}`
        );
      }

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
    const calculatedQuantity = quantity || amount;

    // Validate quantity matches amount if provided
    if (quantity !== null && quantity !== undefined && quantity !== amount) {
      throw new Error(`quantity (${quantity}) phải bằng amount (${amount})`);
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
        // Check bằng cách so sánh tokenIds
        const existingInvoice = await this._commercialInvoiceRepository.findByTokenIds(
          distributorId,
          pharmacyId,
          drugId,
          selectedTokenIds
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
          selectedTokenIds,
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
          const requestTokenIds = selectedTokenIds.map(id => String(id).trim()).sort();
          
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
  }
}

