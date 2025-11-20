export class ConfirmContractDTO {
  constructor(contractId, distributorAddress) {
    this.contractId = contractId;
    this.distributorAddress = distributorAddress;
  }

  static fromRequest(req) {
    const { contractId, distributorAddress } = req.body;
    return new ConfirmContractDTO(contractId, distributorAddress);
  }

  validate() {
    if (!this.contractId) {
      throw new Error("Contract ID là bắt buộc");
    }
    if (!this.distributorAddress) {
      throw new Error("Distributor address là bắt buộc");
    }
  }
}

