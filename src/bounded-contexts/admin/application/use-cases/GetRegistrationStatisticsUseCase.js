import { GetRegistrationStatisticsDTO } from "../dto/GetRegistrationStatisticsDTO.js";

export class GetRegistrationStatisticsUseCase {
  constructor(registrationRequestRepository) {
    this._registrationRequestRepository = registrationRequestRepository;
  }

  async execute(dto) {
    dto.validate();

    const totalRequests = await this._registrationRequestRepository.count();

    const byStatus = {
      pending: await this._registrationRequestRepository.countByStatus("pending"),
      approved_pending_blockchain: await this._registrationRequestRepository.countByStatus("approved_pending_blockchain"),
      approved: await this._registrationRequestRepository.countByStatus("approved"),
      blockchain_failed: await this._registrationRequestRepository.countByStatus("blockchain_failed"),
      rejected: await this._registrationRequestRepository.countByStatus("rejected"),
    };

    const byRole = {
      pharma_company: await this._registrationRequestRepository.countByRole("pharma_company"),
      distributor: await this._registrationRequestRepository.countByRole("distributor"),
      pharmacy: await this._registrationRequestRepository.countByRole("pharmacy"),
    };

    // Thống kê theo thời gian (7 ngày gần đây)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentRequests = await this._registrationRequestRepository.countSinceDate(last7Days);

    return {
      total: totalRequests,
      byStatus,
      byRole,
      recentRequests,
    };
  }
}

