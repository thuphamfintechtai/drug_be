export class GetDistributionHistoryDTO {
  constructor(
    page = 1,
    limit = 20,
    distributorId,
    pharmacyId,
    drugId,
    status,
    startDate,
    endDate
  ) {
    this.page = parseInt(page);
    this.limit = parseInt(limit);
    this.distributorId = distributorId;
    this.pharmacyId = pharmacyId;
    this.drugId = drugId;
    this.status = status;
    this.startDate = startDate ? new Date(startDate) : null;
    this.endDate = endDate ? new Date(endDate) : null;
  }

  static fromRequest(req) {
    const {
      page,
      limit,
      distributorId,
      pharmacyId,
      drugId,
      status,
      startDate,
      endDate,
    } = req.query;
    return new GetDistributionHistoryDTO(
      page,
      limit,
      distributorId,
      pharmacyId,
      drugId,
      status,
      startDate,
      endDate
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

