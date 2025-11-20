export class CreateContractRequestDTO {
  constructor(pharmacyId, contractFileUrl, contractFileName) {
    this.pharmacyId = pharmacyId;
    this.contractFileUrl = contractFileUrl;
    this.contractFileName = contractFileName;
  }

  static fromRequest(req) {
    const { pharmacyId, contractFileUrl, contractFileName } = req.body;
    return new CreateContractRequestDTO(pharmacyId, contractFileUrl, contractFileName);
  }

  validate() {
    if (!this.pharmacyId) {
      throw new Error("Pharmacy ID là bắt buộc");
    }
    if (!this.contractFileUrl) {
      throw new Error("Contract file URL là bắt buộc");
    }
  }
}

