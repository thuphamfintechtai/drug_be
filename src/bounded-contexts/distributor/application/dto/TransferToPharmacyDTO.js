export class TransferToPharmacyDTO {
  constructor(
    pharmacyId,
    drugId,
    amount,
    tokenIds = null,
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
    this.amount = amount;
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
      amount,
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
      amount ? parseInt(amount) : null,
      tokenIds && Array.isArray(tokenIds) ? tokenIds.map(id => String(id).trim()) : null,
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

    // Nếu có tokenIds, validate tokenIds; nếu không có, validate amount
    if (this.tokenIds && Array.isArray(this.tokenIds) && this.tokenIds.length > 0) {
      // Nếu có tokenIds, amount phải bằng số lượng tokenIds
      if (this.amount && this.amount !== this.tokenIds.length) {
        errors.push(`amount (${this.amount}) phải bằng số lượng tokenIds (${this.tokenIds.length})`);
      }
      // Validate tokenIds không được trùng lặp
      const uniqueTokenIds = [...new Set(this.tokenIds)];
      if (uniqueTokenIds.length !== this.tokenIds.length) {
        errors.push("tokenIds không được chứa giá trị trùng lặp");
      }
    } else {
      // Nếu không có tokenIds, amount là bắt buộc
      if (!this.amount || this.amount <= 0 || !Number.isInteger(this.amount)) {
        errors.push("amount phải là số nguyên dương (hoặc cung cấp tokenIds)");
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return true;
  }
}

