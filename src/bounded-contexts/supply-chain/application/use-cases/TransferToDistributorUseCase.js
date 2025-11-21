import { ManufacturerInvoice } from "../../domain/aggregates/ManufacturerInvoice.js";
import { NFT } from "../../domain/aggregates/NFT.js";
import { DrugNotFoundException } from "../../domain/exceptions/DrugNotFoundException.js";
import crypto from "crypto";

export class TransferToDistributorUseCase {
  constructor(
    drugInfoRepository,
    nftRepository,
    manufacturerInvoiceRepository,
    eventBus
  ) {
    this._drugInfoRepository = drugInfoRepository;
    this._nftRepository = nftRepository;
    this._manufacturerInvoiceRepository = manufacturerInvoiceRepository;
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
    notes = null
  ) {
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

    // Generate invoice number if not provided
    const finalInvoiceNumber = invoiceNumber || `INV-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;

    // Create manufacturer invoice
    const invoice = ManufacturerInvoice.create(
      manufacturerId,
      distributorId,
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

    await this._manufacturerInvoiceRepository.save(invoice);

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

