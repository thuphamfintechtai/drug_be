import { ConfirmReceiptDTO } from "../dto/ConfirmReceiptDTO.js";
import { ProofOfPharmacy } from "../../domain/aggregates/ProofOfPharmacy.js";
import { BatchNumber } from "../../../supply-chain/domain/value-objects/BatchNumber.js";

export class ConfirmReceiptUseCase {
  constructor(
    commercialInvoiceRepository,
    proofOfPharmacyRepository,
    nftRepository,
    eventBus
  ) {
    this._commercialInvoiceRepository = commercialInvoiceRepository;
    this._proofOfPharmacyRepository = proofOfPharmacyRepository;
    this._nftRepository = nftRepository;
    this._eventBus = eventBus;
  }

  async execute(dto, pharmacyId) {
    dto.validate();

    // Find invoice
    const invoice = await this._commercialInvoiceRepository.findById(dto.invoiceId);
    if (!invoice) {
      throw new Error("Không tìm thấy invoice");
    }

    // Check invoice belongs to this pharmacy
    if (invoice.toPharmacyId !== pharmacyId) {
      throw new Error("Bạn không có quyền xác nhận invoice này");
    }

    // Check invoice status
    if (invoice.status !== "sent") {
      throw new Error(`Invoice chưa được gửi. Trạng thái hiện tại: ${invoice.status}`);
    }

    if (!invoice.tokenIds || invoice.tokenIds.length === 0) {
      throw new Error("Invoice không chứa tokenIds để xác nhận");
    }

    const nfts = await this._nftRepository.findByTokenIds(invoice.tokenIds);
    if (nfts.length !== invoice.tokenIds.length) {
      throw new Error("Danh sách NFT không đầy đủ so với tokenIds của invoice");
    }

    const unauthorizedNFTs = nfts.filter(nft => nft.ownerId !== pharmacyId);
    if (unauthorizedNFTs.length > 0) {
      const tokens = unauthorizedNFTs.map(nft => nft.tokenId).join(", ");
      throw new Error(
        `Các NFT chưa thuộc quyền sở hữu pharmacy hiện tại: ${tokens}`
      );
    }

    // Get batch number from NFTs
    let batchNumber = null;
    const firstNft = nfts[0];
    if (firstNft && firstNft.batchNumber) {
      batchNumber = firstNft.batchNumber;
    }

    // Normalize IDs to ensure they are strings (not objects)
    const normalizeId = (id) => {
      if (!id) return null;
      if (typeof id === 'string') return id.trim();
      if (id && id.toString) {
        const str = id.toString();
        // Check if it's a valid ObjectId format (24 hex chars)
        if (/^[0-9a-fA-F]{24}$/.test(str)) {
          return str;
        }
        return str;
      }
      return String(id).trim();
    };

    const normalizedFromDistributorId = normalizeId(invoice.fromDistributorId);
    const normalizedPharmacyId = normalizeId(pharmacyId);
    const normalizedInvoiceId = normalizeId(dto.invoiceId);
    const normalizedNftInfoId = normalizeId(invoice.nftInfoId);
    const normalizedDrugId = normalizeId(invoice.drugId);

    // Find or create Proof of Pharmacy
    let proofOfPharmacy = null;
    const existingProofs = await this._proofOfPharmacyRepository.findByCommercialInvoice(dto.invoiceId);
    
    if (existingProofs.length > 0) {
      proofOfPharmacy = existingProofs[0];
      
      // Prevent double-confirm: if already confirmed, return existing state
      if (proofOfPharmacy.status === "confirmed") {
        return {
          proofOfPharmacyId: proofOfPharmacy.id,
          invoiceId: invoice.id,
          status: proofOfPharmacy.status,
          batchNumber: proofOfPharmacy.batchNumber,
          message: "Receipt đã được xác nhận trước đó",
        };
      }
      
      proofOfPharmacy.confirmReceipt();
      
      if (dto.receivedBy) {
        // Note: In a real implementation, you might want to add a setReceivedBy method
        proofOfPharmacy._receivedBy = dto.receivedBy;
      }
      
      if (dto.receiptAddress) {
        proofOfPharmacy._receiptAddress = dto.receiptAddress;
      }
      
      if (dto.qualityCheck) {
        proofOfPharmacy._qualityCheck = dto.qualityCheck;
      }
      
      if (dto.notes) {
        proofOfPharmacy._notes = dto.notes;
      }
    } else {
      // Create new proof of pharmacy
      proofOfPharmacy = ProofOfPharmacy.create(
        normalizedFromDistributorId,
        normalizedPharmacyId,
        dto.receivedQuantity || invoice.quantity,
        normalizedInvoiceId,
        null, // proofOfDistributionId
        normalizedNftInfoId,
        normalizedDrugId,
        dto.receiptDate || new Date(),
        batchNumber ? BatchNumber.create(batchNumber) : null,
        dto.receivedBy,
        dto.receiptAddress,
        dto.qualityCheck,
        dto.notes
      );
      
      proofOfPharmacy.confirmReceipt();
    }

    const savedProofOfPharmacy = await this._proofOfPharmacyRepository.save(proofOfPharmacy);

    // Update CommercialInvoice with proofOfPharmacyId if not already set
    if (!invoice.proofOfPharmacyId) {
      const normalizedProofOfPharmacyId = normalizeId(savedProofOfPharmacy.id);
      invoice.setProofOfPharmacyId(normalizedProofOfPharmacyId);
      await this._commercialInvoiceRepository.save(invoice);
    }

    // Publish domain events
    proofOfPharmacy.domainEvents.forEach(event => {
      this._eventBus.publish(event);
    });

    return {
      proofOfPharmacyId: savedProofOfPharmacy.id,
      invoiceId: invoice.id,
      status: savedProofOfPharmacy.status,
      batchNumber: savedProofOfPharmacy.batchNumber,
    };
  }
}

