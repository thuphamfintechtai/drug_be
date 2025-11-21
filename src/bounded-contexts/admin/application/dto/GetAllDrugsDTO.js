export class GetAllDrugsDTO {
  constructor(search, status, manufacturerId, page = 1, limit = 20) {
    this.search = search;
    this.status = status;
    this.manufacturerId = manufacturerId;
    this.page = parseInt(page);
    this.limit = parseInt(limit);
  }

  static fromRequest(req) {
    const { search, status, manufacturerId, page, limit } = req.query;
    return new GetAllDrugsDTO(search, status, manufacturerId, page, limit);
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

