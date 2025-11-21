import { INFTRepository } from "../../../domain/repositories/INFTRepository.js";
import { NFTInfoModel } from "./schemas/NFTInfoSchema.js";
import { NFTMapper } from "./mappers/NFTMapper.js";

export class NFTRepository extends INFTRepository {
  async findById(id) {
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

  async save(nft) {
    const document = NFTMapper.toPersistence(nft);

    const isObjectId = nft.id && nft.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(nft.id);

    if (isObjectId && document._id) {
      const updated = await NFTInfoModel.findByIdAndUpdate(
        document._id,
        { $set: document },
        { new: true, runValidators: true }
      )
        .populate("drug")
        .populate("owner")
        .populate("proofOfProduction");
      return NFTMapper.toDomain(updated);
    } else {
      const created = await NFTInfoModel.create(document);
      const saved = await NFTInfoModel.findById(created._id)
        .populate("drug")
        .populate("owner")
        .populate("proofOfProduction");
      return NFTMapper.toDomain(saved);
    }
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

