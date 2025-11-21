export class UploadIPFSDTO {
  constructor(quantity, metadata = null) {
    this.quantity = quantity;
    this.metadata = metadata || {};
  }

  static fromRequest(req) {
    const { quantity, metadata } = req.body;
    return new UploadIPFSDTO(quantity, metadata);
  }

  validate() {
    const errors = [];

    if (!this.quantity || typeof this.quantity !== "number" || this.quantity <= 0) {
      errors.push("Quantity phải là số dương");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return true;
  }
}

