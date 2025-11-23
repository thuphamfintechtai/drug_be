import { ManufacturerInvoice } from "../../domain/aggregates/ManufacturerInvoice.js";
import { NFT } from "../../domain/aggregates/NFT.js";
import { DrugNotFoundException } from "../../domain/exceptions/DrugNotFoundException.js";
import crypto from "crypto";

export class TransferToDistributorUseCase {
  constructor(
    drugInfoRepository,
    nftRepository,
    manufacturerInvoiceRepository,
    proofOfProductionRepository,
    eventBus
  ) {
    this._drugInfoRepository = drugInfoRepository;
    this._nftRepository = nftRepository;
    this._manufacturerInvoiceRepository = manufacturerInvoiceRepository;
    this._proofOfProductionRepository = proofOfProductionRepository;
    this._eventBus = eventBus;
  }

  async execute(
    manufacturerId,
    distributorId,
    drugId,
    tokenIds,
    invoiceNumber,
    invoiceDate = null,
    quantity = null,
    unitPrice = null,
    totalAmount = null,
    vatRate = null,
    vatAmount = null,
    finalAmount = null,
    notes = null,
    batchNumber = null,
    chainTxHash = null
  ) {
    // Convert distributorId to User ID if it's a Distributor entity ID
    let finalDistributorId = distributorId;
    const { DistributorModel } = await import("../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js");
    const mongoose = await import("mongoose");
    
    // Check if distributorId is a valid ObjectId
    if (mongoose.default.Types.ObjectId.isValid(distributorId)) {
      // Try to find Distributor entity by ID
      const distributorEntity = await DistributorModel.findById(distributorId);
      if (distributorEntity && distributorEntity.user) {
        // If found, use the User ID instead
        finalDistributorId = distributorEntity.user.toString();
      }
    }

    // Check drug exists and belongs to manufacturer
    const drug = await this._drugInfoRepository.findById(drugId);
    if (!drug) {
      throw new DrugNotFoundException(`Thuốc với ID ${drugId} không tồn tại`);
    }

    if (drug.manufacturerId !== manufacturerId) {
      throw new Error("Bạn không có quyền chuyển giao thuốc này");
    }

    // Check NFTs exist and belong to manufacturer
    const nfts = await this._nftRepository.findByTokenIds(tokenIds);
    if (nfts.length !== tokenIds.length) {
      const foundTokenIds = nfts.map(nft => nft.tokenId);
      const missingTokenIds = tokenIds.filter(tid => !foundTokenIds.includes(tid));
      throw new Error(`Không tìm thấy một số tokenId: ${missingTokenIds.join(", ")}`);
    }

    // Validate all NFTs belong to manufacturer and can be transferred
    for (const nft of nfts) {
      if (nft.manufacturerId !== manufacturerId) {
        throw new Error(`NFT với tokenId ${nft.tokenId} không thuộc về manufacturer này`);
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

    // Get proof of production from first NFT (all should have same batch)
    const proofOfProductionId = nfts[0]?.proofOfProductionId || null;
    const nftInfoId = nfts[0]?.id || null;

    // Update ProofOfProduction status to "distributed" if exists
    if (proofOfProductionId && this._proofOfProductionRepository) {
      const proofOfProduction = await this._proofOfProductionRepository.findById(proofOfProductionId);
      if (proofOfProduction && proofOfProduction.status === "completed") {
        proofOfProduction.markAsDistributed();
        await this._proofOfProductionRepository.save(proofOfProduction);
      }
    }

    // Generate invoice number if not provided
    const finalInvoiceNumber = invoiceNumber || `INV-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;

    // Create manufacturer invoice
    const invoice = ManufacturerInvoice.create(
      manufacturerId,
      finalDistributorId,
      drugId,
      finalInvoiceNumber,
      calculatedQuantity,
      tokenIds,
      invoiceDate,
      proofOfProductionId,
      nftInfoId,
      unitPrice,
      totalAmount,
      vatRate,
      vatAmount,
      finalAmount,
      notes
    );

    invoice.issue(); // Automatically issue the invoice

    // Set chainTxHash if provided
    if (chainTxHash) {
      invoice.setChainTxHash(chainTxHash);
    }

    await this._manufacturerInvoiceRepository.save(invoice);

    // Save batchNumber if provided (batchNumber is not in domain aggregate, save directly to document)
    if (batchNumber) {
      const { ManufacturerInvoiceModel } = await import("../../infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js");
      const mongoose = await import("mongoose");
      
      // Try to update by ID if it's a valid ObjectId, otherwise use invoiceNumber
      if (mongoose.default.Types.ObjectId.isValid(invoice.id)) {
        await ManufacturerInvoiceModel.findByIdAndUpdate(
          invoice.id,
          { $set: { batchNumber } },
          { new: true }
        );
      } else {
        // If ID is not ObjectId (e.g., UUID), find by invoiceNumber
        await ManufacturerInvoiceModel.findOneAndUpdate(
          { invoiceNumber: invoice.invoiceNumber },
          { $set: { batchNumber } },
          { new: true }
        );
      }
    }

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

