import { ConfirmReceiptDTO } from "../dto/ConfirmReceiptDTO.js";
import { ProofOfDistribution } from "../../domain/aggregates/ProofOfDistribution.js";
import { DistributionStatus } from "../../domain/aggregates/ProofOfDistribution.js";
import { BatchNumber } from "../../../supply-chain/domain/value-objects/BatchNumber.js";

export class ConfirmReceiptUseCase {
  constructor(
    manufacturerInvoiceRepository,
    proofOfDistributionRepository,
    nftRepository,
    proofOfProductionRepository,
    eventBus
  ) {
    this._manufacturerInvoiceRepository = manufacturerInvoiceRepository;
    this._proofOfDistributionRepository = proofOfDistributionRepository;
    this._nftRepository = nftRepository;
    this._proofOfProductionRepository = proofOfProductionRepository;
    this._eventBus = eventBus;
  }

  async execute(dto, distributorId) {
    dto.validate();

    // Find invoice
    const invoice = await this._manufacturerInvoiceRepository.findById(dto.invoiceId);
    if (!invoice) {
      throw new Error("Không tìm thấy invoice");
    }

    // Check invoice belongs to this distributor
    if (invoice.toDistributorId !== distributorId) {
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

    console.log("Distributor confirm:", {
      distributorId,
      nftOwners: nfts.map(nft => ({ tokenId: nft.tokenId, ownerId: nft.ownerId })),
    });

    const unauthorizedNFTs = nfts.filter(nft => nft.ownerId !== distributorId);
    if (unauthorizedNFTs.length > 0) {
      const tokens = unauthorizedNFTs.map(nft => nft.tokenId).join(", ");
      throw new Error(
        `Các NFT chưa thuộc quyền sở hữu distributor hiện tại: ${tokens}`
      );
    }

    // Get batch number from NFT/proof
    let batchNumber = null;
    const firstNft = nfts[0];
    if (firstNft && firstNft.batchNumber) {
      batchNumber = firstNft.batchNumber;
    } else if (firstNft && firstNft.proofOfProductionId) {
      const proof = await this._proofOfProductionRepository.findById(firstNft.proofOfProductionId);
      if (proof) {
        batchNumber = proof.batchNumber;
      }
    } else if (invoice.proofOfProductionId) {
      const proof = await this._proofOfProductionRepository.findById(invoice.proofOfProductionId);
      if (proof) {
        batchNumber = proof.batchNumber;
      }
    }

    // Find or create Proof of Distribution
    let proofOfDistribution = null;
    const existingProofs = await this._proofOfDistributionRepository.findByManufacturerInvoice(dto.invoiceId);
    
    if (existingProofs.length > 0) {
      proofOfDistribution = existingProofs[0];
      proofOfDistribution.confirmReceipt();
      
      if (dto.receivedBy) {
        // Note: receivedBy is a complex object in the schema, simplified here
        // In a real implementation, you might want to add a setReceivedBy method to the aggregate
      }
      
      if (dto.distributionDate) {
        // Note: distributionDate is already set in constructor
      }
      
      if (dto.distributedQuantity) {
        // Note: distributedQuantity should be updated via a method
      }
    } else {
      // Create new proof of distribution
      proofOfDistribution = ProofOfDistribution.create(
        invoice.fromManufacturerId,
        distributorId,
        dto.distributedQuantity || invoice.quantity,
        dto.invoiceId,
        invoice.proofOfProductionId,
        invoice.nftInfoId,
        dto.distributionDate || new Date(),
        batchNumber ? BatchNumber.create(batchNumber) : null,
        invoice.tokenIds || []
      );
      
      proofOfDistribution.confirmReceipt();
    }

    await this._proofOfDistributionRepository.save(proofOfDistribution);

    // Confirm invoice status
    invoice.confirm();
    await this._manufacturerInvoiceRepository.save(invoice);

    // Publish domain events
    proofOfDistribution.domainEvents.forEach(event => {
      this._eventBus.publish(event);
    });

    return {
      proofOfDistributionId: proofOfDistribution.id,
      invoiceId: invoice.id,
      invoiceStatus: invoice.status,
      status: proofOfDistribution.status,
      batchNumber: proofOfDistribution.batchNumber,
    };
  }
}

