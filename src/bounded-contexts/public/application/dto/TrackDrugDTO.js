export class TrackDrugDTO {
  constructor(tokenId) {
    this.tokenId = tokenId;
  }

  static fromRequest(req) {
    const { tokenId } = req.params;
    return new TrackDrugDTO(tokenId);
  }

  validate() {
    const errors = [];

    if (!this.tokenId) {
      errors.push("tokenId là bắt buộc");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return true;
  }
}

