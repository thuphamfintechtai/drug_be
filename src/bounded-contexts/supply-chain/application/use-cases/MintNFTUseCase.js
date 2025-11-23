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

    let drug = await this._drugInfoRepository.findByIdOrCodeOrName(dto.drugId, manufacturerId);
    
    if (!drug) {
      const drugWithoutFilter = await this._drugInfoRepository.findByIdOrCodeOrName(dto.drugId, null);
      if (drugWithoutFilter) {
        throw new Error("Bạn không có quyền mint NFT cho thuốc này");
      }
      throw new DrugNotFoundException(`Thuốc với ID ${dto.drugId} không tồn tại`);
    }
    const existingNFTs = await this._nftRepository.findByTokenIds(dto.tokenIds);
    if (existingNFTs.length > 0) {
      const existingTokenIds = existingNFTs.map(nft => nft.tokenId);
      throw new Error(`Một số tokenId đã tồn tại: ${existingTokenIds.join(", ")}`);
    }
    const ipfsHash = IPFSHash.create(
      dto.ipfsUrl.split("/").pop() || dto.ipfsUrl,
      dto.ipfsUrl
    );

    const chainTxHash = TransactionHash.create(dto.transactionHash);
    const proofOfProduction = ProofOfProduction.create(
      manufacturerId,
      dto.drugId,
      dto.batchNumber || `BATCH-${Date.now()}`,
      dto.quantity,
      dto.mfgDate,
      dto.expDate
    );

    proofOfProduction.completeProduction(dto.transactionHash);
    // Store domain events before saving (they will be lost after save because new instance is created from MongoDB document)
    const proofOfProductionEvents = [...proofOfProduction.domainEvents];
    // Save and get the saved instance with MongoDB ObjectId
    const savedProofOfProduction = await this._proofOfProductionRepository.save(proofOfProduction);

    // Create NFTs
    const nfts = [];
    for (let i = 0; i < dto.tokenIds.length; i++) {
      const tokenId = dto.tokenIds[i];
      const serialNumber = `${savedProofOfProduction.batchNumber}-${tokenId}`;
      
      // Extract metadata for this specific NFT if available
      const nftMetadata = dto.metadata && dto.metadata[i] ? dto.metadata[i] : dto.metadata;

      const nft = NFT.create(
        tokenId,
        dto.drugId,
        manufacturerId,
        savedProofOfProduction.batchNumber,
        serialNumber,
        1, // quantity per NFT
        dto.mfgDate,
        dto.expDate,
        ipfsHash,
        nftMetadata,
        savedProofOfProduction.id
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

    // Publish domain events (use events from original instance as saved instance doesn't have them)
    proofOfProductionEvents.forEach(event => {
      this._eventBus.publish(event);
    });

    nfts.forEach(nft => {
      nft.domainEvents.forEach(event => {
        this._eventBus.publish(event);
      });
    });

    return {
      proofOfProductionId: savedProofOfProduction.id,
      batchNumber: savedProofOfProduction.batchNumber,
      quantity: savedProofOfProduction.quantity,
      nftIds: nfts.map(nft => nft.id),
      tokenIds: nfts.map(nft => nft.tokenId),
      transactionHash: dto.transactionHash,
    };
  }
}

