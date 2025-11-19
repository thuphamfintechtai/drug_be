import { Entity } from "../../../../shared-kernel/domain/Entity.js";
import { CompanyName } from "../value-objects/CompanyName.js";
import { LicenseNumber } from "../value-objects/LicenseNumber.js";
import { TaxCode } from "../value-objects/TaxCode.js";

export class CompanyInfo extends Entity {
  constructor(
    id,
    name,
    licenseNo,
    taxCode,
    address = "",
    country = "",
    contactEmail = "",
    contactPhone = "",
    gmpCertNo = ""
  ) {
    super(id);
    this._name = CompanyName.create(name);
    this._licenseNo = LicenseNumber.create(licenseNo);
    this._taxCode = TaxCode.create(taxCode);
    this._address = address || "";
    this._country = country || "";
    this._contactEmail = contactEmail || "";
    this._contactPhone = contactPhone || "";
    this._gmpCertNo = gmpCertNo || "";
  }

  static create(
    id,
    name,
    licenseNo,
    taxCode,
    address = "",
    country = "",
    contactEmail = "",
    contactPhone = "",
    gmpCertNo = ""
  ) {
    return new CompanyInfo(
      id,
      name,
      licenseNo,
      taxCode,
      address,
      country,
      contactEmail,
      contactPhone,
      gmpCertNo
    );
  }

  get name() {
    return this._name.value;
  }

  get nameVO() {
    return this._name;
  }

  get licenseNo() {
    return this._licenseNo.value;
  }

  get licenseNoVO() {
    return this._licenseNo;
  }

  get taxCode() {
    return this._taxCode.value;
  }

  get taxCodeVO() {
    return this._taxCode;
  }

  get address() {
    return this._address;
  }

  get country() {
    return this._country;
  }

  get contactEmail() {
    return this._contactEmail;
  }

  get contactPhone() {
    return this._contactPhone;
  }

  get gmpCertNo() {
    return this._gmpCertNo;
  }
}

