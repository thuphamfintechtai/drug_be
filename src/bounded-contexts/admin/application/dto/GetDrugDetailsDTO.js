export class GetDrugDetailsDTO {
  constructor(drugId) {
    this.drugId = drugId;
  }

  static fromRequest(req) {
    const { drugId } = req.params;
    return new GetDrugDetailsDTO(drugId);
  }

  validate() {
    if (!this.drugId) {
      throw new Error("drugId là bắt buộc");
    }
    return true;
  }
}

