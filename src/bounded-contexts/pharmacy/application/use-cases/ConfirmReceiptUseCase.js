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

    // Find or create Proof of Pharmacy
    let proofOfPharmacy = null;
    const existingProofs = await this._proofOfPharmacyRepository.findByCommercialInvoice(dto.invoiceId);
    
    if (existingProofs.length > 0) {
      proofOfPharmacy = existingProofs[0];
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
        invoice.fromDistributorId,
        pharmacyId,
        dto.receivedQuantity || invoice.quantity,
        dto.invoiceId,
        null, // proofOfDistributionId
        invoice.nftInfoId,
        invoice.drugId,
        dto.receiptDate || new Date(),
        batchNumber ? BatchNumber.create(batchNumber) : null,
        dto.receivedBy,
        dto.receiptAddress,
        dto.qualityCheck,
        dto.notes
      );
      
      proofOfPharmacy.confirmReceipt();
    }

    await this._proofOfPharmacyRepository.save(proofOfPharmacy);

    // Publish domain events
    proofOfPharmacy.domainEvents.forEach(event => {
      this._eventBus.publish(event);
    });

    return {
      proofOfPharmacyId: proofOfPharmacy.id,
      invoiceId: invoice.id,
      status: proofOfPharmacy.status,
      batchNumber: proofOfPharmacy.batchNumber,
    };
  }
}

