import { CreateDrugDTO } from "../dto/CreateDrugDTO.js";
import { DrugInfo } from "../../domain/aggregates/DrugInfo.js";
import { DrugNotFoundException } from "../../domain/exceptions/DrugNotFoundException.js";
import crypto from "crypto";

export class CreateDrugUseCase {
  constructor(drugInfoRepository, eventBus) {
    this._drugInfoRepository = drugInfoRepository;
    this._eventBus = eventBus;
  }

  async execute(dto, manufacturerId) {
    dto.validate();

    // Check if ATC code already exists
    const existingDrug = await this._drugInfoRepository.findByATCCode(dto.atcCode);
    if (existingDrug) {
      throw new Error("ATC code đã tồn tại");
    }

    // Create drug info aggregate
    const drugId = crypto.randomUUID();
    const drugInfo = DrugInfo.create(
      drugId,
      manufacturerId,
      dto.tradeName,
      dto.atcCode,
      dto.genericName,
      dto.dosageForm,
      dto.strength,
      dto.route,
      dto.packaging,
      dto.storage,
      dto.warnings,
      dto.activeIngredients
    );

    // Save drug info
    await this._drugInfoRepository.save(drugInfo);

    // Publish domain events
    drugInfo.domainEvents.forEach((event) => {
      this._eventBus.publish(event);
    });

    return {
      id: drugInfo.id,
      tradeName: drugInfo.drugName,
      genericName: drugInfo.genericName,
      atcCode: drugInfo.atcCode,
      manufacturerId: drugInfo.manufacturerId,
      status: drugInfo.status,
    };
  }
}

