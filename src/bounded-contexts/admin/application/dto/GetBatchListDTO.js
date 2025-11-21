export class GetBatchListDTO {
  constructor(
    page = 1,
    limit = 20,
    batchNumber,
    manufacturer,
    status,
    drugName,
    fromDate,
    toDate
  ) {
    this.page = parseInt(page);
    this.limit = parseInt(limit);
    this.batchNumber = batchNumber;
    this.manufacturer = manufacturer;
    this.status = status;
    this.drugName = drugName;
    this.fromDate = fromDate ? new Date(fromDate) : null;
    this.toDate = toDate ? new Date(toDate) : null;
  }

  static fromRequest(req) {
    const { page, limit, batchNumber, manufacturer, status, drugName, fromDate, toDate } =
      req.query;
    return new GetBatchListDTO(
      page,
      limit,
      batchNumber,
      manufacturer,
      status,
      drugName,
      fromDate,
      toDate
    );
  }

  validate() {
    if (this.page < 1) {
      throw new Error("Page phải lớn hơn 0");
    }
    if (this.limit < 1 || this.limit > 100) {
      throw new Error("Limit phải từ 1 đến 100");
    }
    return true;
  }

  getSkip() {
    return (this.page - 1) * this.limit;
  }
}

