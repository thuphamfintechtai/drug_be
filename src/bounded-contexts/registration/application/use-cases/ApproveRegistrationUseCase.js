import { ApproveRegistrationDTO } from "../dto/ApproveRegistrationDTO.js";
import { RegistrationRequestNotFoundException } from "../../domain/exceptions/RegistrationRequestNotFoundException.js";
import { BusinessEntityCreated } from "../../domain/domain-events/BusinessEntityCreated.js";
import { BusinessEntityRegisteredOnBlockchain } from "../../domain/domain-events/BusinessEntityRegisteredOnBlockchain.js";

export class ApproveRegistrationUseCase {
  constructor(
    registrationRequestRepository,
    userRepository,
    businessEntityRepository,
    businessEntityFactory,
    blockchainAdapter,
    registrationDomainService,
    eventBus
  ) {
    this._registrationRequestRepository = registrationRequestRepository;
    this._userRepository = userRepository;
    this._businessEntityRepository = businessEntityRepository;
    this._businessEntityFactory = businessEntityFactory;
    this._blockchainAdapter = blockchainAdapter;
    this._registrationDomainService = registrationDomainService;
    this._eventBus = eventBus;
  }

  async execute(dto) {
    dto.validate();

    // Validate and get registration request
    const request = await this._registrationDomainService.validateRegistrationRequestCanBeReviewed(
      dto.requestId
    );

    if (!request) {
      throw new RegistrationRequestNotFoundException();
    }

    // Get user
    const user = await this._userRepository.findById(request.userId);
    if (!user) {
      throw new Error("User không tồn tại");
    }

    // Check required fields
    if (!user.walletAddress || !request.companyInfo.licenseNo || !request.companyInfo.taxCode) {
      throw new Error("Thiếu thông tin cần thiết: walletAddress, taxCode, licenseNo");
    }

    // Approve request
    request.approve(dto.reviewedBy);
    await this._registrationRequestRepository.save(request);

    // Publish approval event
    request.domainEvents.forEach((event) => {
      this._eventBus.publish(event);
    });

    // Register on blockchain
    let blockchainResult;
    try {
      blockchainResult = await this._blockchainAdapter.registerBusinessEntity(
        request.role,
        user.walletAddress,
        request.companyInfo.taxCode,
        request.companyInfo.licenseNo
      );

      request.markBlockchainSuccess(blockchainResult.transactionHash, blockchainResult.contractAddress);
      await this._registrationRequestRepository.save(request);

      // Create business entity
      const businessEntity = await this._businessEntityFactory.createBusinessEntity(
        user,
        request.role,
        request.companyInfo,
        blockchainResult
      );

      await this._businessEntityRepository.save(businessEntity);

      // Link user to business entity
      user.linkBusinessEntity(request.role, businessEntity.id);
      user.activate();
      await this._userRepository.save(user);

      // Publish events
      this._eventBus.publish(
        new BusinessEntityCreated(
          businessEntity.id,
          request.role,
          user.id,
          businessEntity.name,
          businessEntity.licenseNo,
          businessEntity.taxCode
        )
      );

      this._eventBus.publish(
        new BusinessEntityRegisteredOnBlockchain(
          businessEntity.id,
          request.role,
          blockchainResult.transactionHash,
          blockchainResult.contractAddress
        )
      );

      return {
        registrationRequest: {
          id: request.id,
          status: request.status,
          transactionHash: request.transactionHash,
        },
        businessEntity: {
          id: businessEntity.id,
          name: businessEntity.name,
        },
      };
    } catch (blockchainError) {
      console.error("Lỗi khi gửi lên blockchain:", blockchainError);

      request.markBlockchainFailed();
      await this._registrationRequestRepository.save(request);

      throw new Error("Phê duyệt thành công nhưng gặp lỗi khi gửi lên blockchain: " + blockchainError.message);
    }
  }
}

