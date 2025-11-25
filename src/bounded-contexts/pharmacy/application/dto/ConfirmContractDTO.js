export class ConfirmContractDTO {
  constructor(contractId, distributorAddress, pharmacyPrivateKey = null, pharmacySignature = null, pharmacyAddress = null, signedMessage = null) {
    this.contractId = contractId;
    this.distributorAddress = distributorAddress;
    this.pharmacyPrivateKey = pharmacyPrivateKey;
    this.pharmacySignature = pharmacySignature;
    this.pharmacyAddress = pharmacyAddress;
    this.signedMessage = signedMessage;
  }

  static fromRequest(req) {
    const {
      contractId,
      distributorAddress,
      pharmacyPrivateKey,
      pharmacySignature,
      pharmacyAddress,
      signedMessage,
    } = req.body;
    return new ConfirmContractDTO(contractId, distributorAddress, pharmacyPrivateKey || null, pharmacySignature || null, pharmacyAddress || null, signedMessage || null);
  }

  validate() {
    if (!this.contractId) {
      throw new Error("Contract ID là bắt buộc");
    }
    if (!this.distributorAddress) {
      throw new Error("Distributor address là bắt buộc");
    }

    // Require either a private key (legacy) or a signature payload
    if (!this.pharmacyPrivateKey && !(this.pharmacySignature && this.pharmacyAddress && this.signedMessage)) {
      throw new Error("Cần cung cấp pharmacyPrivateKey hoặc (pharmacySignature, pharmacyAddress, signedMessage)");
    }
  }
}

