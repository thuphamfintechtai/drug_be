export class FinalizeContractDTO {
  constructor(contractId, pharmacyAddress) {
    this.contractId = contractId;
    this.pharmacyAddress = pharmacyAddress;
  }

  static fromRequest(req) {
    const { contractId, pharmacyAddress } = req.body;
    return new FinalizeContractDTO(contractId, pharmacyAddress);
  }

  validate() {
    if (!this.contractId) {
      throw new Error("Contract ID là bắt buộc");
    }
    if (!this.pharmacyAddress) {
      throw new Error("Pharmacy address là bắt buộc");
    }
  }
}

