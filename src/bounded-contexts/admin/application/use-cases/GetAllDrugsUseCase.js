import { GetAllDrugsDTO } from "../dto/GetAllDrugsDTO.js";

export class GetAllDrugsUseCase {
  constructor(drugInfoRepository) {
    this._drugInfoRepository = drugInfoRepository;
  }

  async execute(dto) {
    dto.validate();

    // Build filter
    const filter = {};
    if (dto.status) {
      filter.status = dto.status;
    }
    if (dto.manufacturerId) {
      filter.manufacturer = dto.manufacturerId;
    }
    if (dto.search) {
      filter.$or = [
        { drugName: { $regex: dto.search, $options: "i" } },
        { genericName: { $regex: dto.search, $options: "i" } },
        { atcCode: { $regex: dto.search, $options: "i" } },
      ];
    }

    // Use repository's find method if available, otherwise use model directly
    // For now, using model directly for pagination
    const { DrugInfoModel } = await import(
      "../../../supply-chain/infrastructure/persistence/mongoose/schemas/DrugInfoSchema.js"
    );

    const drugs = await DrugInfoModel.find(filter)
      .populate("manufacturer", "name licenseNo taxCode country address")
      .sort({ createdAt: -1 })
      .skip(dto.getSkip())
      .limit(dto.limit);

    const total = await DrugInfoModel.countDocuments(filter);

    return {
      drugs,
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total,
        pages: Math.ceil(total / dto.limit),
      },
    };
  }
}
