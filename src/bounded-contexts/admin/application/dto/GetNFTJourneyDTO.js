export class GetNFTJourneyDTO {
  constructor(tokenId) {
    this.tokenId = tokenId;
  }

  static fromRequest(req) {
    const { tokenId } = req.params;
    return new GetNFTJourneyDTO(tokenId);
  }

  validate() {
    if (!this.tokenId) {
      throw new Error("tokenId là bắt buộc");
    }
    return true;
  }
}

