import { MintNFTDTO } from "../dto/MintNFTDTO.js";
import { NFT } from "../../domain/aggregates/NFT.js";
import { ProofOfProduction } from "../../domain/aggregates/ProofOfProduction.js";
import { DrugNotFoundException } from "../../domain/exceptions/DrugNotFoundException.js";
import { IPFSHash } from "../../domain/value-objects/IPFSHash.js";
import { TransactionHash } from "../../domain/value-objects/TransactionHash.js";
import crypto from "crypto";

export class MintNFTUseCase {
  constructor(
    drugInfoRepository,
    nftRepository,
    proofOfProductionRepository,
    eventBus
  ) {
    this._drugInfoRepository = drugInfoRepository;
    this._nftRepository = nftRepository;
    this._proofOfProductionRepository = proofOfProductionRepository;
    this._eventBus = eventBus;
  }

  async execute(dto, manufacturerId) {
    dto.validate();

    // Check drug exists and belongs to manufacturer
    // Try to find by ID, ATC code, or name
    let drug = await this._drugInfoRepository.findByIdOrCodeOrName(dto.drugId, manufacturerId);
    
    if (!drug) {
      throw new DrugNotFoundException(`Thuốc với ID ${dto.drugId} không tồn tại`);
    }

    // Verify ownership - convert both to string for comparison
    const drugManufacturerId = String(drug.manufacturerId || "");
    const userManufacturerId = String(manufacturerId || "");
    if (drugManufacturerId !== userManufacturerId) {
      throw new Error("Bạn không có quyền mint NFT cho thuốc này");
    }

    // Check tokenIds already exist
    const existingNFTs = await this._nftRepository.findByTokenIds(dto.tokenIds);
    if (existingNFTs.length > 0) {
      const existingTokenIds = existingNFTs.map(nft => nft.tokenId);
      throw new Error(`Một số tokenId đã tồn tại: ${existingTokenIds.join(", ")}`);
    }

    // Parse IPFS URL to get hash
    const ipfsHash = IPFSHash.create(
      dto.ipfsUrl.split("/").pop() || dto.ipfsUrl,
      dto.ipfsUrl
    );

    const chainTxHash = TransactionHash.create(dto.transactionHash);

    // Create Proof of Production
    const proofOfProduction = ProofOfProduction.create(
      manufacturerId,
      dto.drugId,
      dto.batchNumber || `BATCH-${Date.now()}`,
      dto.quantity,
      dto.mfgDate,
      dto.expDate
    );

    proofOfProduction.completeProduction(dto.transactionHash);
    await this._proofOfProductionRepository.save(proofOfProduction);

    // Create NFTs
    const nfts = [];
    for (let i = 0; i < dto.tokenIds.length; i++) {
      const tokenId = dto.tokenIds[i];
      const serialNumber = `${proofOfProduction.batchNumber}-${tokenId}`;
      
      // Extract metadata for this specific NFT if available
      const nftMetadata = dto.metadata && dto.metadata[i] ? dto.metadata[i] : dto.metadata;

      const nft = NFT.create(
        tokenId,
        dto.drugId,
        manufacturerId,
        proofOfProduction.batchNumber,
        serialNumber,
        1, // quantity per NFT
        dto.mfgDate,
        dto.expDate,
        ipfsHash,
        nftMetadata,
        proofOfProduction.id
      );

      nft.setMintTransaction(dto.transactionHash);
      nfts.push(nft);
    }

    // Save all NFTs
    await this._nftRepository.saveMany(nfts);

    // Update ManufactureIPFSStatus from "Pending" to "SuccessFully"
    const { ManufactureIPFSStatusModel } = await import("../../infrastructure/persistence/mongoose/schemas/ManufactureIPFSStatusSchema.js");
    const { PharmaCompanyModel } = (await import("../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js"));

    // Find PharmaCompany by manufacturerId (could be _id or user id)
    let pharmaCompany = await PharmaCompanyModel.findById(manufacturerId);
    if (!pharmaCompany) {
      // Try to find by user id
      pharmaCompany = await PharmaCompanyModel.findOne({ user: manufacturerId });
    }

    if (pharmaCompany && dto.ipfsUrl) {
      const result = await ManufactureIPFSStatusModel.updateOne(
        {
          manufacture: pharmaCompany._id,
          IPFSUrl: dto.ipfsUrl,
        },
        {
          $set: { status: "SuccessFully" },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`${result.modifiedCount} tài liệu ManufactureIPFSStatus đã được cập nhật thành công.`);
      }
    }

    // Publish domain events
    proofOfProduction.domainEvents.forEach(event => {
      this._eventBus.publish(event);
    });

    nfts.forEach(nft => {
      nft.domainEvents.forEach(event => {
        this._eventBus.publish(event);
      });
    });

    return {
      proofOfProductionId: proofOfProduction.id,
      batchNumber: proofOfProduction.batchNumber,
      quantity: proofOfProduction.quantity,
      nftIds: nfts.map(nft => nft.id),
      tokenIds: nfts.map(nft => nft.tokenId),
      transactionHash: dto.transactionHash,
    };
  }
}

