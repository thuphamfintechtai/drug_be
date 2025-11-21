export class UpdateDrugDTO {
  constructor(data = {}) {
    this.tradeName = data.tradeName;
    this.genericName = data.genericName;
    this.dosageForm = data.dosageForm;
    this.strength = data.strength;
    this.route = data.route;
    this.packaging = data.packaging;
    this.storage = data.storage;
    this.warnings = data.warnings;
    this.activeIngredients = data.activeIngredients;
    this.status = data.status;
  }

  static fromRequest(req) {
    const {
      tradeName,
      genericName,
      dosageForm,
      strength,
      route,
      packaging,
      storage,
      warnings,
      activeIngredients,
      status,
    } = req.body;

    return new UpdateDrugDTO({
      tradeName,
      genericName,
      dosageForm,
      strength,
      route,
      packaging,
      storage,
      warnings,
      activeIngredients,
      status,
    });
  }

  hasUpdates() {
    return (
      this.tradeName !== undefined ||
      this.genericName !== undefined ||
      this.dosageForm !== undefined ||
      this.strength !== undefined ||
      this.route !== undefined ||
      this.packaging !== undefined ||
      this.storage !== undefined ||
      this.warnings !== undefined ||
      this.activeIngredients !== undefined ||
      this.status !== undefined
    );
  }
}

