import { UpdateDrugDTO } from "../dto/UpdateDrugDTO.js";
import { DrugNotFoundException } from "../../domain/exceptions/DrugNotFoundException.js";

export class UpdateDrugUseCase {
  constructor(drugInfoRepository, eventBus) {
    this._drugInfoRepository = drugInfoRepository;
    this._eventBus = eventBus;
  }

  async execute(drugId, dto, manufacturerId) {
    let drugInfo = await this._drugInfoRepository.findByIdOrCodeOrName(drugId, manufacturerId);
    
    if (!drugInfo) {
      const drugWithoutFilter = await this._drugInfoRepository.findByIdOrCodeOrName(drugId, null);
      if (drugWithoutFilter) {
        throw new Error("Bạn không có quyền cập nhật thuốc này");
      }
      throw new DrugNotFoundException(`Thuốc với ID ${drugId} không tồn tại`);
    }

    if (!dto.hasUpdates()) {
      return drugInfo;
    }

    // Update drug info
    if (dto.tradeName !== undefined || dto.genericName !== undefined) {
      // Update drug name if either trade name or generic name is provided
      const tradeName = dto.tradeName !== undefined ? dto.tradeName : drugInfo.drugName;
      const genericName = dto.genericName !== undefined ? dto.genericName : drugInfo.genericName;
      
      const DrugName = (await import("../../domain/value-objects/DrugName.js")).DrugName;
      drugInfo._drugName = DrugName.create(tradeName, genericName);
    }

    if (dto.dosageForm !== undefined) drugInfo._dosageForm = dto.dosageForm;
    if (dto.strength !== undefined) drugInfo._strength = dto.strength;
    if (dto.route !== undefined) drugInfo._route = dto.route;
    if (dto.packaging !== undefined) drugInfo._packaging = dto.packaging;
    if (dto.storage !== undefined) drugInfo._storage = dto.storage;
    if (dto.warnings !== undefined) drugInfo._warnings = dto.warnings;
    if (dto.activeIngredients !== undefined) drugInfo._activeIngredients = dto.activeIngredients;

    if (dto.status !== undefined) {
      if (dto.status === "active") {
        drugInfo.activate();
      } else if (dto.status === "inactive") {
        drugInfo.deactivate();
      } else if (dto.status === "recalled") {
        drugInfo.recall();
      }
    }

    drugInfo._updatedAt = new Date();

    // Save
    const updated = await this._drugInfoRepository.save(drugInfo);

    // Publish domain events
    updated.domainEvents.forEach((event) => {
      this._eventBus.publish(event);
    });

    return updated;
  }
}

