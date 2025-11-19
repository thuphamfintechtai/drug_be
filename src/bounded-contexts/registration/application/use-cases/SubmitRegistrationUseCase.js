import { SubmitRegistrationDTO } from "../dto/SubmitRegistrationDTO.js";
import { RegistrationRequest } from "../../domain/aggregates/RegistrationRequest.js";
import { CompanyInfo } from "../../domain/entities/CompanyInfo.js";
import { User } from "../../../identity-access/domain/aggregates/User.js";
import { Role } from "../../../identity-access/domain/value-objects/Role.js";
import { WalletAddress } from "../../domain/value-objects/WalletAddress.js";
import { DuplicateLicenseNumberException } from "../../domain/exceptions/DuplicateLicenseNumberException.js";
import crypto from "crypto";

export class SubmitRegistrationUseCase {
  constructor(
    userRepository,
    registrationRequestRepository,
    passwordHasher,
    registrationDomainService,
    eventBus
  ) {
    this._userRepository = userRepository;
    this._registrationRequestRepository = registrationRequestRepository;
    this._passwordHasher = passwordHasher;
    this._registrationDomainService = registrationDomainService;
    this._eventBus = eventBus;
  }

  async execute(dto) {
    dto.validate();

    // Check if user already exists
    const existingUser = await this._userRepository.findByEmailOrUsername(dto.email, dto.username);
    if (existingUser) {
      throw new Error("Email hoặc username đã tồn tại");
    }

    // Validate unique license and tax code
    try {
      await this._registrationDomainService.validateUniqueLicenseAndTaxCode(
        dto.licenseNo,
        dto.taxCode
      );
    } catch (error) {
      throw new DuplicateLicenseNumberException(error.message);
    }

    // Create user
    const userId = crypto.randomUUID();
    const passwordHash = await this._passwordHasher.hash(dto.password);
    const walletAddressVO = WalletAddress.create(dto.walletAddress);

    const user = User.create(
      userId,
      dto.username,
      dto.email,
      passwordHash,
      dto.role,
      dto.fullName || "",
      dto.contactPhone || "",
      dto.country || "",
      dto.address || ""
    );

    user.setWalletAddress(walletAddressVO.value);
    await this._userRepository.save(user);

    // Publish user registered events
    user.domainEvents.forEach((event) => {
      this._eventBus.publish(event);
    });

    // Create company info
    const companyInfoId = crypto.randomUUID();
    const companyInfo = CompanyInfo.create(
      companyInfoId,
      dto.name,
      dto.licenseNo,
      dto.taxCode,
      dto.address,
      dto.country,
      dto.contactEmail,
      dto.contactPhone,
      dto.gmpCertNo
    );

    // Create registration request
    const registrationRequest = RegistrationRequest.create(userId, dto.role, companyInfo);
    await this._registrationRequestRepository.save(registrationRequest);

    // Publish registration events
    registrationRequest.domainEvents.forEach((event) => {
      this._eventBus.publish(event);
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      registrationRequest: {
        id: registrationRequest.id,
        status: registrationRequest.status,
      },
    };
  }
}

