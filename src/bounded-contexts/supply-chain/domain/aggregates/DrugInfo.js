import { AggregateRoot } from "../../../../shared-kernel/domain/AggregateRoot.js";
import { DrugName } from "../value-objects/DrugName.js";
import { ATCCode } from "../value-objects/ATCCode.js";
import crypto from "crypto";

export const DrugStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  RECALLED: "recalled",
};

export class DrugInfo extends AggregateRoot {
  constructor(
    id,
    manufacturerId,
    drugName,
    atcCode,
    dosageForm = null,
    strength = null,
    route = null,
    packaging = null,
    storage = null,
    warnings = null,
    activeIngredients = [],
    status = DrugStatus.ACTIVE
  ) {
    super(id);
    this._manufacturerId = manufacturerId;
    this._drugName = drugName;
    this._atcCode = atcCode;
    this._dosageForm = dosageForm || "";
    this._strength = strength || "";
    this._route = route || "";
    this._packaging = packaging || "";
    this._storage = storage || "";
    this._warnings = warnings || "";
    this._activeIngredients = activeIngredients || [];
    this._status = status;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  static create(
    id,
    manufacturerId,
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
    const drugName = DrugName.create(tradeName, genericName);
    const atcCodeVO = ATCCode.create(atcCode);

    return new DrugInfo(
      id || crypto.randomUUID(),
      manufacturerId,
      drugName,
      atcCodeVO,
      dosageForm,
      strength,
      route,
      packaging,
      storage,
      warnings,
      activeIngredients,
      DrugStatus.ACTIVE
    );
  }

  get manufacturerId() {
    return this._manufacturerId;
  }

  get drugName() {
    return this._drugName.tradeName;
  }

  get drugNameVO() {
    return this._drugName;
  }

  get genericName() {
    return this._drugName.genericName;
  }

  get atcCode() {
    return this._atcCode.value;
  }

  get atcCodeVO() {
    return this._atcCode;
  }

  get dosageForm() {
    return this._dosageForm;
  }

  get strength() {
    return this._strength;
  }

  get route() {
    return this._route;
  }

  get packaging() {
    return this._packaging;
  }

  get storage() {
    return this._storage;
  }

  get warnings() {
    return this._warnings;
  }

  get activeIngredients() {
    return [...this._activeIngredients];
  }

  get status() {
    return this._status;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  isActive() {
    return this._status === DrugStatus.ACTIVE;
  }

  activate() {
    this._status = DrugStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  deactivate() {
    this._status = DrugStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  recall() {
    this._status = DrugStatus.RECALLED;
    this._updatedAt = new Date();
  }

  updateInfo(
    dosageForm = null,
    strength = null,
    route = null,
    packaging = null,
    storage = null,
    warnings = null,
    activeIngredients = null
  ) {
    if (dosageForm !== null) this._dosageForm = dosageForm;
    if (strength !== null) this._strength = strength;
    if (route !== null) this._route = route;
    if (packaging !== null) this._packaging = packaging;
    if (storage !== null) this._storage = storage;
    if (warnings !== null) this._warnings = warnings;
    if (activeIngredients !== null) this._activeIngredients = activeIngredients;
    this._updatedAt = new Date();
  }
}

