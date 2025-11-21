export class RetryBlockchainRegistrationDTO {
  constructor(requestId) {
    this.requestId = requestId;
  }

  static fromRequest(req) {
    const { requestId } = req.params;
    return new RetryBlockchainRegistrationDTO(requestId);
  }

  validate() {
    const errors = [];

    if (!this.requestId) {
      errors.push("requestId là bắt buộc");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return true;
  }
}

