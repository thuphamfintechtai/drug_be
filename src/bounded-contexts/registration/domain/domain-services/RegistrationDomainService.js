export class RegistrationDomainService {
  constructor(registrationRequestRepository, businessEntityRepository) {
    this._registrationRequestRepository = registrationRequestRepository;
    this._businessEntityRepository = businessEntityRepository;
  }

  async validateUniqueLicenseAndTaxCode(licenseNo, taxCode) {
    const existing = await this._businessEntityRepository.findByLicenseNoOrTaxCode(
      licenseNo,
      taxCode
    );

    if (existing) {
      throw new Error("LicenseNo hoặc TaxCode đã được sử dụng");
    }

    // Also check pending registration requests
    const pendingRequest = await this._registrationRequestRepository.findByLicenseNoOrTaxCode(
      licenseNo,
      taxCode
    );

    if (pendingRequest) {
      throw new Error("LicenseNo hoặc TaxCode đã được sử dụng trong yêu cầu đang chờ duyệt");
    }
  }

  async validateRegistrationRequestCanBeReviewed(requestId) {
    const request = await this._registrationRequestRepository.findById(requestId);

    if (!request) {
      throw new Error("Không tìm thấy yêu cầu đăng ký");
    }

    if (!request.canBeReviewed()) {
      throw new Error(`Yêu cầu này đã được xử lý với trạng thái: ${request.status}`);
    }

    return request;
  }
}

