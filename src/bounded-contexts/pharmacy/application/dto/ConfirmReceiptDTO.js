export class ConfirmReceiptDTO {
  constructor(
    invoiceId,
    receivedBy = null,
    receiptAddress = null,
    qualityCheck = null,
    receiptDate = null,
    receivedQuantity = null,
    notes = null
  ) {
    this.invoiceId = invoiceId;
    this.receivedBy = receivedBy;
    this.receiptAddress = receiptAddress;
    this.qualityCheck = qualityCheck;
    this.receiptDate = receiptDate;
    this.receivedQuantity = receivedQuantity;
    this.notes = notes;
  }

  static fromRequest(req) {
    const {
      invoiceId,
      receivedBy,
      receiptAddress,
      qualityCheck,
      receiptDate,
      receivedQuantity,
      notes,
    } = req.body;

    return new ConfirmReceiptDTO(
      invoiceId,
      receivedBy,
      receiptAddress,
      qualityCheck,
      receiptDate ? new Date(receiptDate) : null,
      receivedQuantity ? parseInt(receivedQuantity) : null,
      notes
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

