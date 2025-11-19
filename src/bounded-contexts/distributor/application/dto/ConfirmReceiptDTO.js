export class ConfirmReceiptDTO {
  constructor(
    invoiceId,
    receivedBy = null,
    deliveryAddress = null,
    shippingInfo = null,
    notes = null,
    distributionDate = null,
    distributedQuantity = null
  ) {
    this.invoiceId = invoiceId;
    this.receivedBy = receivedBy;
    this.deliveryAddress = deliveryAddress;
    this.shippingInfo = shippingInfo;
    this.notes = notes;
    this.distributionDate = distributionDate;
    this.distributedQuantity = distributedQuantity;
  }

  static fromRequest(req) {
    const {
      invoiceId,
      receivedBy,
      deliveryAddress,
      shippingInfo,
      notes,
      distributionDate,
      distributedQuantity,
    } = req.body;

    return new ConfirmReceiptDTO(
      invoiceId,
      receivedBy,
      deliveryAddress,
      shippingInfo,
      notes,
      distributionDate ? new Date(distributionDate) : null,
      distributedQuantity ? parseInt(distributedQuantity) : null
    );
  }

  validate() {
    const errors = [];

    if (!this.invoiceId) {
      errors.push("invoiceId là bắt buộc");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return true;
  }
}

