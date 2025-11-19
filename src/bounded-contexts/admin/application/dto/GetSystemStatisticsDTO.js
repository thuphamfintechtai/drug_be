export class GetSystemStatisticsDTO {
  constructor() {
    // No input parameters needed
  }

  static fromRequest(req) {
    return new GetSystemStatisticsDTO();
  }

  validate() {
    return true;
  }
}

