export class GetBatchJourneyDTO {
  constructor(batchNumber) {
    this.batchNumber = batchNumber;
  }

  static fromRequest(req) {
    const { batchNumber } = req.params;
    return new GetBatchJourneyDTO(batchNumber);
  }

  validate() {
    if (!this.batchNumber) {
      throw new Error("batchNumber là bắt buộc");
    }
    return true;
  }
}

