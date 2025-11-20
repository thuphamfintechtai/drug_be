import { TrackDrugDTO } from "../../application/dto/TrackDrugDTO.js";

export class PublicController {
  constructor(publicTrackingService) {
    this._publicTrackingService = publicTrackingService;
  }

  async trackDrugByNFTId(req, res) {
    try {
      const dto = TrackDrugDTO.fromRequest(req);
      dto.validate();

      const result = await this._publicTrackingService.trackDrugByTokenId(dto.tokenId);

      return res.status(200).json({
        success: true,
        message: "Lấy thông tin tracking thành công",
        data: result,
      });
    } catch (error) {
      if (error.message && (error.message.includes("không tìm thấy") || error.message.includes("là bắt buộc"))) {
        return res.status(error.message.includes("không tìm thấy") ? 404 : 400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi track drug:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi track drug",
        error: error.message,
      });
    }
  }

  async trackingDrugsInfo(req, res) {
    try {
      const { identifier } = req.params;

      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: "Identifier là bắt buộc",
        });
      }

      // Try to find by tokenId first
      let trackingInfo = null;
      try {
        trackingInfo = await this._publicTrackingService.trackDrugByTokenId(identifier);
      } catch (error) {
        // If not found by tokenId, try to find by serialNumber or batchNumber
        const { NFTInfoModel } = await import("../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js");
        const nft = await NFTInfoModel.findOne({
          $or: [
            { tokenId: identifier },
            { serialNumber: identifier },
            { batchNumber: identifier }
          ]
        });

        if (!nft) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy NFT với identifier này",
          });
        }

        // Use tokenId to track
        trackingInfo = await this._publicTrackingService.trackDrugByTokenId(nft.tokenId);
      }

      return res.status(200).json({
        success: true,
        data: trackingInfo,
      });
    } catch (error) {
      if (error.message && error.message.includes("không tìm thấy")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi tracking drug:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi tracking drug",
        error: error.message,
      });
    }
  }

  async searchDrugByATCCode(req, res) {
    try {
      const { atcCode } = req.query;

      if (!atcCode) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp ATC code",
        });
      }

      const DrugInfoRepository = (await import("../../../supply-chain/infrastructure/persistence/mongoose/DrugInfoRepository.js")).DrugInfoRepository;
      const drugRepo = new DrugInfoRepository();
      const drug = await drugRepo.findByATCCode(atcCode);

      if (!drug) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thuốc với ATC code này",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: drug.id,
          tradeName: drug.drugName,
          genericName: drug.genericName,
          atcCode: drug.atcCode,
          dosageForm: drug.dosageForm,
          strength: drug.strength,
          packaging: drug.packaging,
          status: drug.status,
        },
      });
    } catch (error) {
      if (error.message && error.message.includes("không tìm thấy")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi tìm kiếm thuốc:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi tìm kiếm thuốc",
        error: error.message,
      });
    }
  }
}

