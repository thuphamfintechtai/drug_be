export class FinalizeContractDTO {
  constructor(contractId, pharmacyAddress, tokenId = null, transactionHash = null) {
    this.contractId = contractId;
    this.pharmacyAddress = pharmacyAddress;
    this.tokenId = tokenId;
    this.transactionHash = transactionHash;
  }

  static fromRequest(req) {
    const { contractId, pharmacyAddress, tokenId, transactionHash } = req.body;
    // Parse tokenId thành number nếu có
    const parsedTokenId = tokenId !== undefined && tokenId !== null ? parseInt(tokenId, 10) : null;
    return new FinalizeContractDTO(contractId, pharmacyAddress, parsedTokenId, transactionHash);
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

