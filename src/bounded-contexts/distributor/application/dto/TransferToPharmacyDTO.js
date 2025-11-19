export class TransferToPharmacyDTO {
  constructor(
    pharmacyId,
    drugId,
    tokenIds,
    invoiceNumber = null,
    invoiceDate = null,
    quantity = null,
    unitPrice = null,
    totalAmount = null,
    vatRate = null,
    vatAmount = null,
    finalAmount = null,
    notes = null
  ) {
    this.pharmacyId = pharmacyId;
    this.drugId = drugId;
    this.tokenIds = tokenIds;
    this.invoiceNumber = invoiceNumber;
    this.invoiceDate = invoiceDate;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.totalAmount = totalAmount;
    this.vatRate = vatRate;
    this.vatAmount = vatAmount;
    this.finalAmount = finalAmount;
    this.notes = notes;
  }

  static fromRequest(req) {
    const {
      pharmacyId,
      drugId,
      tokenIds,
      invoiceNumber,
      invoiceDate,
      quantity,
      unitPrice,
      totalAmount,
      vatRate,
      vatAmount,
      finalAmount,
      notes,
    } = req.body;

    return new TransferToPharmacyDTO(
      pharmacyId,
      drugId,
      tokenIds,
      invoiceNumber,
      invoiceDate ? new Date(invoiceDate) : null,
      quantity ? parseInt(quantity) : null,
      unitPrice ? parseFloat(unitPrice) : null,
      totalAmount ? parseFloat(totalAmount) : null,
      vatRate ? parseFloat(vatRate) : null,
      vatAmount ? parseFloat(vatAmount) : null,
      finalAmount ? parseFloat(finalAmount) : null,
      notes
    );
  }

  validate() {
    const errors = [];

    if (!this.pharmacyId) {
      errors.push("pharmacyId là bắt buộc");
    }

    if (!this.drugId) {
      errors.push("drugId là bắt buộc");
    }

    if (!this.tokenIds || !Array.isArray(this.tokenIds) || this.tokenIds.length === 0) {
      errors.push("tokenIds phải là array không rỗng");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return true;
  }
}

