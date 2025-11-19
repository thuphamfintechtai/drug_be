import { CreateDrugUseCase } from "../use-cases/CreateDrugUseCase.js";
import { UpdateDrugUseCase } from "../use-cases/UpdateDrugUseCase.js";
import { CreateDrugDTO } from "../dto/CreateDrugDTO.js";
import { UpdateDrugDTO } from "../dto/UpdateDrugDTO.js";

export class DrugManagementApplicationService {
  constructor(drugInfoRepository, nftRepository, eventBus) {
    this._drugInfoRepository = drugInfoRepository;
    this._nftRepository = nftRepository || null;
    this._eventBus = eventBus;
    this._createDrugUseCase = new CreateDrugUseCase(drugInfoRepository, eventBus);
    this._updateDrugUseCase = new UpdateDrugUseCase(drugInfoRepository, eventBus);
  }

  async createDrug(dto, manufacturerId) {
    return await this._createDrugUseCase.execute(dto, manufacturerId);
  }

  async updateDrug(drugId, dto, manufacturerId) {
    return await this._updateDrugUseCase.execute(drugId, dto, manufacturerId);
  }

  async getDrugById(drugId, manufacturerId) {
    const drugInfo = await this._drugInfoRepository.findById(drugId);
    
    if (!drugInfo) {
      throw new (await import("../../domain/exceptions/DrugNotFoundException.js")).DrugNotFoundException(`Thuốc với ID ${drugId} không tồn tại`);
    }

    // Check ownership
    if (drugInfo.manufacturerId !== manufacturerId) {
      throw new Error("Bạn không có quyền xem thuốc này");
    }

    return drugInfo;
  }

  async getDrugs(manufacturerId, filters = {}) {
    const drugs = await this._drugInfoRepository.findByManufacturer(manufacturerId);
    
    // Apply filters if needed
    let filtered = drugs;
    
    if (filters.status) {
      filtered = filtered.filter(d => d.status === filters.status);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(d => 
        d.drugName.toLowerCase().includes(searchLower) ||
        (d.genericName && d.genericName.toLowerCase().includes(searchLower)) ||
        d.atcCode.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  async deleteDrug(drugId, manufacturerId) {
    const drugInfo = await this._drugInfoRepository.findById(drugId);
    
    if (!drugInfo) {
      throw new (await import("../../domain/exceptions/DrugNotFoundException.js")).DrugNotFoundException(`Thuốc với ID ${drugId} không tồn tại`);
    }

    // Check ownership
    if (drugInfo.manufacturerId !== manufacturerId) {
      throw new Error("Bạn không có quyền xóa thuốc này");
    }

    // Check if drug is being used by any NFT
    try {
      if (this._nftRepository) {
        const nfts = await this._nftRepository.findByDrug(drugId);
        if (nfts && nfts.length > 0) {
          throw new Error(`Không thể xóa thuốc này vì đang được sử dụng bởi ${nfts.length} NFT(s). Vui lòng deactivate thay vì xóa.`);
        }
      } else {
        // Fallback: Check using Mongoose model directly
        const NFTInfoModel = (await import("../../../infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js")).NFTInfoModel;
        if (NFTInfoModel) {
          const nfts = await NFTInfoModel.find({ drug: drugId });
          if (nfts && nfts.length > 0) {
            throw new Error(`Không thể xóa thuốc này vì đang được sử dụng bởi ${nfts.length} NFT(s). Vui lòng deactivate thay vì xóa.`);
          }
        }
      }
    } catch (error) {
      // If error is already about NFTs, rethrow it
      if (error.message && error.message.includes("NFT")) {
        throw error;
      }
      // Otherwise, log and continue with deletion
      console.warn("Không thể kiểm tra NFT khi xóa thuốc:", error.message);
    }

    await this._drugInfoRepository.delete(drugId);
    return true;
  }

  async searchByATCCode(atcCode, manufacturerId) {
    const drugInfo = await this._drugInfoRepository.findByATCCode(atcCode);
    
    if (!drugInfo) {
      throw new (await import("../../domain/exceptions/DrugNotFoundException.js")).DrugNotFoundException(`Thuốc với ATC code ${atcCode} không tồn tại`);
    }

    // Check ownership
    if (drugInfo.manufacturerId !== manufacturerId) {
      throw new Error("Bạn không có quyền xem thuốc này");
    }

    return drugInfo;
  }
}

