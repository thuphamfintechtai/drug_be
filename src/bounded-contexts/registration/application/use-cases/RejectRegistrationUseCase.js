import { ApproveRegistrationDTO } from "../dto/ApproveRegistrationDTO.js";
import { RegistrationRequestNotFoundException } from "../../domain/exceptions/RegistrationRequestNotFoundException.js";

export class RejectRegistrationUseCase {
  constructor(
    registrationRequestRepository,
    userRepository,
    registrationDomainService,
    eventBus
  ) {
    this._registrationRequestRepository = registrationRequestRepository;
    this._userRepository = userRepository;
    this._registrationDomainService = registrationDomainService;
    this._eventBus = eventBus;
  }

  async execute(dto, rejectionReason = "") {
    dto.validate();

    // Validate and get registration request
    const request = await this._registrationDomainService.validateRegistrationRequestCanBeReviewed(
      dto.requestId
    );

    if (!request) {
      throw new RegistrationRequestNotFoundException();
    }

    // Reject request
    request.reject(dto.reviewedBy, rejectionReason);

    // Deactivate user
    const user = await this._userRepository.findById(request.userId);
    if (user) {
      user.deactivate();
      await this._userRepository.save(user);
    }

    // Save request
    await this._registrationRequestRepository.save(request);

    // Publish rejection event
    request.domainEvents.forEach((event) => {
      this._eventBus.publish(event);
    });

    return {
      id: request.id,
      status: request.status,
      rejectionReason: request.rejectionReason,
    };
  }
}

