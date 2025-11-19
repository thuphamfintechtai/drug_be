import { SubmitRegistrationUseCase } from "../use-cases/SubmitRegistrationUseCase.js";
import { ApproveRegistrationUseCase } from "../use-cases/ApproveRegistrationUseCase.js";
import { RejectRegistrationUseCase } from "../use-cases/RejectRegistrationUseCase.js";
import { SubmitRegistrationDTO } from "../dto/SubmitRegistrationDTO.js";
import { ApproveRegistrationDTO } from "../dto/ApproveRegistrationDTO.js";

export class RegistrationApplicationService {
  constructor(
    userRepository,
    registrationRequestRepository,
    businessEntityRepository,
    passwordHasher,
    businessEntityFactory,
    blockchainAdapter,
    registrationDomainService,
    eventBus
  ) {
    this._registrationRequestRepository = registrationRequestRepository;
    this._submitUseCase = new SubmitRegistrationUseCase(
      userRepository,
      registrationRequestRepository,
      passwordHasher,
      registrationDomainService,
      eventBus
    );

    this._approveUseCase = new ApproveRegistrationUseCase(
      registrationRequestRepository,
      userRepository,
      businessEntityRepository,
      businessEntityFactory,
      blockchainAdapter,
      registrationDomainService,
      eventBus
    );

    this._rejectUseCase = new RejectRegistrationUseCase(
      registrationRequestRepository,
      userRepository,
      registrationDomainService,
      eventBus
    );
  }

  async submitPharmaCompanyRegistration(dto) {
    return await this._submitUseCase.execute(dto);
  }

  async submitDistributorRegistration(dto) {
    return await this._submitUseCase.execute(dto);
  }

  async submitPharmacyRegistration(dto) {
    return await this._submitUseCase.execute(dto);
  }

  async approveRegistration(dto) {
    return await this._approveUseCase.execute(dto);
  }

  async rejectRegistration(dto, rejectionReason) {
    return await this._rejectUseCase.execute(dto, rejectionReason);
  }

  async getRegistrationRequests(filters = {}) {
    return await this._registrationRequestRepository.findAll(filters);
  }

  async getRegistrationRequestById(requestId) {
    return await this._registrationRequestRepository.findWithUserDetails(requestId);
  }
}

