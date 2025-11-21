export class CreateDrugDTO {
  constructor(
    tradeName,
    atcCode,
    genericName = null,
    dosageForm = null,
    strength = null,
    route = null,
    packaging = null,
    storage = null,
    warnings = null,
    activeIngredients = []
  ) {
    this.tradeName = tradeName;
    this.atcCode = atcCode;
    this.genericName = genericName;
    this.dosageForm = dosageForm;
    this.strength = strength;
    this.route = route;
    this.packaging = packaging;
    this.storage = storage;
    this.warnings = warnings;
    this.activeIngredients = activeIngredients || [];
  }

  static fromRequest(req) {
    const {
      tradeName,
      genericName,
      atcCode,
      dosageForm,
      strength,
      route,
      packaging,
      storage,
      warnings,
      activeIngredients,
    } = req.body;

    return new CreateDrugDTO(
      tradeName,
      atcCode,
      genericName,
      dosageForm,
      strength,
      route,
      packaging,
      storage,
      warnings,
      activeIngredients
    );
  }

  validate() {
    const errors = [];

    if (!this.tradeName || !this.tradeName.trim()) {
      errors.push("TradeName là bắt buộc");
    }

    if (!this.atcCode || !this.atcCode.trim()) {
      errors.push("ATC Code là bắt buộc");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return true;
  }
}

