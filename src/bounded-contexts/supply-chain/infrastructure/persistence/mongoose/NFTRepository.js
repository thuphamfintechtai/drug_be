import { INFTRepository } from "../../../domain/repositories/INFTRepository.js";
import { NFTInfoModel } from "./schemas/NFTInfoSchema.js";
import { NFTMapper } from "./mappers/NFTMapper.js";
import mongoose from "mongoose";

export class NFTRepository extends INFTRepository {
  async findById(id) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    
    const document = await NFTInfoModel.findById(id)
      .populate("drug")
      .populate("owner")
      .populate("proofOfProduction");
    return NFTMapper.toDomain(document);
  }

  async findByTokenId(tokenId) {
    const document = await NFTInfoModel.findOne({ tokenId })
      .populate("drug")
      .populate("owner")
      .populate("proofOfProduction");
    return NFTMapper.toDomain(document);
  }

  async findByTokenIds(tokenIds) {
    const documents = await NFTInfoModel.find({ tokenId: { $in: tokenIds } })
      .populate("drug")
      .populate("owner")
      .populate("proofOfProduction");
    return documents.map(doc => NFTMapper.toDomain(doc));
  }

  async findByDrug(drugId) {
    const documents = await NFTInfoModel.find({ drug: drugId })
      .populate("drug")
      .populate("owner")
      .populate("proofOfProduction");
    return documents.map(doc => NFTMapper.toDomain(doc));
  }

  async findByManufacturer(manufacturerId) {
    // NFTs are owned by manufacturer initially, but we need to check through drug's manufacturer
    // This is a simplified version - might need adjustment based on actual data model
    const documents = await NFTInfoModel.find({ owner: manufacturerId })
      .populate("drug")
      .populate("owner")
      .populate("proofOfProduction");
    return documents.map(doc => NFTMapper.toDomain(doc));
  }

  async findByOwner(ownerId) {
    const documents = await NFTInfoModel.find({ owner: ownerId })
      .populate("drug")
      .populate("owner")
      .populate("proofOfProduction");
    return documents.map(doc => NFTMapper.toDomain(doc));
  }

  async findByBatchNumber(batchNumber) {
    const documents = await NFTInfoModel.find({ batchNumber })
      .populate("drug")
      .populate("owner")
      .populate("proofOfProduction");
    return documents.map(doc => NFTMapper.toDomain(doc));
  }

  async findByProofOfProduction(proofOfProductionId) {
    const documents = await NFTInfoModel.find({ proofOfProduction: proofOfProductionId })
      .populate("drug")
      .populate("owner")
      .populate("proofOfProduction");
    return documents.map(doc => NFTMapper.toDomain(doc));
  }

  async save(nft, options = {}) {
    const document = NFTMapper.toPersistence(nft);
    const { session } = options;

    const isObjectId =
      nft.id && nft.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(nft.id);

    if (isObjectId && document._id) {
      const updateOptions = { new: true, runValidators: true };
      if (session) {
        updateOptions.session = session;
      }
      
      const updated = await NFTInfoModel.findByIdAndUpdate(
        document._id,
        { $set: document },
        updateOptions
      )
        .populate("drug")
        .populate("owner")
        .populate("proofOfProduction");
      return NFTMapper.toDomain(updated);
    }

    // Nếu ID domain là UUID, cập nhật theo tokenId để tránh tạo bản ghi mới
    const updateOptions = { new: true, runValidators: true, upsert: true };
    if (session) {
      updateOptions.session = session;
    }
    
    const updatedByToken = await NFTInfoModel.findOneAndUpdate(
      { tokenId: document.tokenId },
      { $set: document },
      updateOptions
    )
      .populate("drug")
      .populate("owner")
      .populate("proofOfProduction");
    return NFTMapper.toDomain(updatedByToken);
  }

  async saveMany(nfts) {
    const documents = nfts.map(nft => NFTMapper.toPersistence(nft));
    const created = await NFTInfoModel.insertMany(documents);
    return created.map(doc => NFTMapper.toDomain(doc));
  }

  async delete(id) {
    await NFTInfoModel.findByIdAndDelete(id);
    return true;
  }
}

