import { GetBatchListDTO } from "../dto/GetBatchListDTO.js";
import { ProofOfProductionModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js";
import { NFTInfoModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js";
import { CommercialInvoiceModel } from "../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js";

export class GetBatchListUseCase {
  async execute(dto) {
    dto.validate();

    let query = {};
    if (dto.batchNumber) {
      query.batchNumber = { $regex: dto.batchNumber, $options: "i" };
    }
    if (dto.manufacturer) {
      query.manufacturer = dto.manufacturer;
    }
    if (dto.fromDate || dto.toDate) {
      query.mfgDate = {};
      if (dto.fromDate) query.mfgDate.$gte = dto.fromDate;
      if (dto.toDate) query.mfgDate.$lte = dto.toDate;
    }

    const batches = await ProofOfProductionModel.find(query)
      .populate("manufacturer", "name licenseNo address")
      .populate("drug", "drugName registrationNo")
      .sort({ createdAt: -1 })
      .skip(dto.getSkip())
      .limit(dto.limit)
      .lean();

    const total = await ProofOfProductionModel.countDocuments(query);

    const enrichedBatches = await Promise.all(
      batches.map(async (batch) => {
        const batchNfts = await NFTInfoModel.find({
          batchNumber: batch.batchNumber,
        })
          .select("_id status")
          .lean();
        const nftIds = batchNfts.map((n) => n._id);

        const nftCount = batchNfts.length;
        const distributedCount = batchNfts.filter((n) =>
          ["transferred", "sold"].includes(n.status)
        ).length;

        const completedInvoices = await CommercialInvoiceModel.countDocuments({
          nftInfo: { $in: nftIds },
          supplyChainCompleted: true,
        });

        let batchStatus = "produced";
        if (completedInvoices > 0) batchStatus = "completed";
        else if (distributedCount > 0) batchStatus = "in_transit";

        return {
          batchNumber: batch.batchNumber,
          drug: batch.drug,
          manufacturer: batch.manufacturer,
          mfgDate: batch.mfgDate,
          expDate: batch.expDate,
          totalQuantity: batch.quantity,
          nftCount,
          distributedCount,
          completedCount: completedInvoices,
          status: batchStatus,
          chainTxHash: batch.chainTxHash,
          createdAt: batch.createdAt,
        };
      })
    );

    let filteredBatches = enrichedBatches;
    if (dto.status) {
      filteredBatches = enrichedBatches.filter((b) => b.status === dto.status);
    }
    if (dto.drugName && filteredBatches.length > 0) {
      filteredBatches = filteredBatches.filter(
        (b) =>
          b.drug &&
          b.drug.drugName &&
          b.drug.drugName.toLowerCase().includes(dto.drugName.toLowerCase())
      );
    }

    return {
      batches: filteredBatches,
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total,
        totalPages: Math.ceil(total / dto.limit),
      },
    };
  }
}

