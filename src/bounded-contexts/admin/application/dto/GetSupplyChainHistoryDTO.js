export class GetSupplyChainHistoryDTO {
  constructor(page = 1, limit = 20, drugId, tokenId, status, startDate, endDate) {
    this.page = parseInt(page);
    this.limit = parseInt(limit);
    this.drugId = drugId;
    this.tokenId = tokenId;
    this.status = status;
    this.startDate = startDate ? new Date(startDate) : null;
    this.endDate = endDate ? new Date(endDate) : null;
  }

  static fromRequest(req) {
    const { page, limit, drugId, tokenId, status, startDate, endDate } = req.query;
    return new GetSupplyChainHistoryDTO(page, limit, drugId, tokenId, status, startDate, endDate);
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

