export class ApproveRegistrationDTO {
  constructor(requestId, reviewedBy) {
    this.requestId = requestId;
    this.reviewedBy = reviewedBy;
  }

  static fromRequest(req) {
    const { requestId } = req.params;
    const reviewedBy = req.user?.id || req.user?._id?.toString();
    return new ApproveRegistrationDTO(requestId, reviewedBy);
  }

  validate() {
    if (!this.requestId) {
      throw new Error("RequestId là bắt buộc");
    }

    if (!this.reviewedBy) {
      throw new Error("ReviewedBy là bắt buộc");
    }

    return true;
  }
}

