export class GetRegistrationStatisticsDTO {
  constructor() {
    // No input parameters needed
  }

  static fromRequest(req) {
    return new GetRegistrationStatisticsDTO();
  }

  validate() {
    return true;
  }
}

