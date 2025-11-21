import { DrugInfoModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/DrugInfoSchema.js";
import { NFTInfoModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js";
import { PharmaCompanyModel } from "../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js";

export class GetDrugStatisticsUseCase {
  constructor() {
    // No dependencies needed - using models directly for statistics
  }

  async execute() {
    const totalDrugs = await DrugInfoModel.countDocuments();

    const byStatus = {
      active: await DrugInfoModel.countDocuments({ status: "active" }),
      inactive: await DrugInfoModel.countDocuments({ status: "inactive" }),
      recalled: await DrugInfoModel.countDocuments({ status: "recalled" }),
    };

    // Thống kê theo manufacturer
    const drugsByManufacturer = await DrugInfoModel.aggregate([
      {
        $group: {
          _id: "$manufacturer",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "pharmacompanies",
          localField: "_id",
          foreignField: "_id",
          as: "manufacturerInfo",
        },
      },
      {
        $unwind: {
          path: "$manufacturerInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          manufacturerId: "$_id",
          manufacturerName: "$manufacturerInfo.name",
          count: 1,
        },
      },
    ]);

    const totalNFTs = await NFTInfoModel.countDocuments();

    const nftByStatus = {
      minted: await NFTInfoModel.countDocuments({ status: "minted" }),
      transferred: await NFTInfoModel.countDocuments({ status: "transferred" }),
      sold: await NFTInfoModel.countDocuments({ status: "sold" }),
      expired: await NFTInfoModel.countDocuments({ status: "expired" }),
      recalled: await NFTInfoModel.countDocuments({ status: "recalled" }),
    };

    return {
      drugs: {
        total: totalDrugs,
        byStatus,
        byManufacturer: drugsByManufacturer,
      },
      nfts: {
        total: totalNFTs,
        byStatus: nftByStatus,
      },
    };
  }
}

