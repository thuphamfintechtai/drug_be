import { RetryBlockchainRegistrationDTO } from "../dto/RetryBlockchainRegistrationDTO.js";
import { RegistrationRequestNotFoundException } from "../../../registration/domain/exceptions/RegistrationRequestNotFoundException.js";
import { RegistrationStatus } from "../../../registration/domain/value-objects/RegistrationStatus.js";

export class RetryBlockchainRegistrationUseCase {
  constructor(
    registrationRequestRepository,
    userRepository,
    blockchainService,
    eventBus
  ) {
    this._registrationRequestRepository = registrationRequestRepository;
    this._userRepository = userRepository;
    this._blockchainService = blockchainService;
    this._eventBus = eventBus;
  }

  async execute(dto, adminId) {
    dto.validate();

    const registrationRequest = await this._registrationRequestRepository.findById(dto.requestId);
    
    if (!registrationRequest) {
      throw new RegistrationRequestNotFoundException(`Không tìm thấy yêu cầu đăng ký với ID ${dto.requestId}`);
    }

    if (registrationRequest.status !== "blockchain_failed") {
      throw new Error(
        `Yêu cầu này không ở trạng thái blockchain_failed. Trạng thái hiện tại: ${registrationRequest.status}`
      );
    }

    // Get user from user repository
    const user = await this._userRepository.findById(registrationRequest.userId);
    if (!user || !user.walletAddress || !registrationRequest.companyInfo?.taxCode || !registrationRequest.companyInfo?.licenseNo) {
      throw new Error("Thiếu thông tin cần thiết: walletAddress, taxCode, licenseNo");
    }

    // Tăng số lần retry và update status
    // Note: We need to manually update internal fields since domain methods don't expose setters
    registrationRequest._blockchainRetryCount += 1;
    registrationRequest._blockchainLastAttempt = new Date();
    registrationRequest._status = RegistrationStatus.approvedPendingBlockchain();
    registrationRequest._updatedAt = new Date();
    await this._registrationRequestRepository.save(registrationRequest);

    // Retry blockchain registration
    let blockchainResult;
    try {
      if (registrationRequest.role === "pharma_company") {
        blockchainResult = await this._blockchainService.addManufacturerToBlockchain(
          user.walletAddress,
          registrationRequest.companyInfo.taxCode,
          registrationRequest.companyInfo.licenseNo
        );
      } else if (registrationRequest.role === "distributor") {
        blockchainResult = await this._blockchainService.addDistributorToBlockchain(
          user.walletAddress,
          registrationRequest.companyInfo.taxCode,
          registrationRequest.companyInfo.licenseNo
        );
      } else if (registrationRequest.role === "pharmacy") {
        blockchainResult = await this._blockchainService.addPharmacyToBlockchain(
          user.walletAddress,
          registrationRequest.companyInfo.taxCode,
          registrationRequest.companyInfo.licenseNo
        );
      } else {
        throw new Error(`Role không hợp lệ: ${registrationRequest.role}`);
      }

      // Success - update status using domain method
      registrationRequest.markBlockchainSuccess(
        blockchainResult.transactionHash,
        blockchainResult.contractAddress || blockchainResult.receipt?.to || null
      );
      
    } catch (error) {
      // Failed again - using domain method
      registrationRequest.markBlockchainFailed();
      await this._registrationRequestRepository.save(registrationRequest);
      throw error;
    }

    // Save after success
    await this._registrationRequestRepository.save(registrationRequest);

    // Publish domain events if available
    if (registrationRequest.domainEvents) {
      registrationRequest.domainEvents.forEach(event => {
        this._eventBus.publish(event);
      });
    }

    return {
      registrationRequestId: registrationRequest.id,
      status: registrationRequest.status,
      blockchainTxHash: registrationRequest.transactionHash,
      retryCount: registrationRequest.blockchainRetryCount,
    };
  }
}

