export class MintNFTDTO {
  constructor(
    drugId,
    tokenIds,
    transactionHash,
    quantity,
    batchNumber,
    ipfsUrl,
    mfgDate = null,
    expDate = null,
    metadata = null
  ) {
    this.drugId = drugId;
    this.tokenIds = tokenIds;
    this.transactionHash = transactionHash;
    this.quantity = quantity;
    this.batchNumber = batchNumber;
    this.ipfsUrl = ipfsUrl;
    this.mfgDate = mfgDate;
    this.expDate = expDate;
    this.metadata = metadata;
  }

  static fromRequest(req) {
    const {
      drugId,
      tokenIds,
      transactionHash,
      quantity,
      batchNumber,
      ipfsUrl,
      mfgDate,
      expDate,
      metadata,
    } = req.body;

    return new MintNFTDTO(
      drugId,
      tokenIds,
      transactionHash,
      quantity,
      batchNumber,
      ipfsUrl,
      mfgDate ? new Date(mfgDate) : null,
      expDate ? new Date(expDate) : null,
      metadata
    );
  }

  validate() {
    const errors = [];

    if (!this.drugId) {
      errors.push("DrugId là bắt buộc");
    }

    if (!this.tokenIds || !Array.isArray(this.tokenIds) || this.tokenIds.length === 0) {
      errors.push("TokenIds phải là array không rỗng");
    }

    if (!this.transactionHash) {
      errors.push("TransactionHash là bắt buộc");
    }

    if (!this.quantity || typeof this.quantity !== "number" || this.quantity <= 0) {
      errors.push("Quantity phải là số dương");
    }

    if (!this.ipfsUrl) {
      errors.push("IPFSUrl là bắt buộc");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return true;
  }
}

