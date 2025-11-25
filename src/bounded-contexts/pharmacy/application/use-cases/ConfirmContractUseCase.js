import { ContractStatus } from "../../../distributor/domain/aggregates/DistributorPharmacyContract.js";
import { ConfirmContractDTO } from "../dto/ConfirmContractDTO.js";
import { ethers } from "ethers";

export class ConfirmContractUseCase {
  constructor(
    contractRepository,
    blockchainService,
    userRepository
  ) {
    this._contractRepository = contractRepository;
    this._blockchainService = blockchainService;
    this._userRepository = userRepository;
  }

  async execute(dto, pharmacyId, pharmacyPrivateKey) {
    dto.validate();

    // Lấy contract từ database
    const contract = await this._contractRepository.findById(dto.contractId);
    if (!contract) {
      throw new Error("Không tìm thấy contract");
    }

    // Normalize IDs to string for safe comparison
    const contractPharmacyId =
      contract.pharmacyId?.toString?.() || contract.pharmacyId;
    const requestedPharmacyId = pharmacyId?.toString?.() || pharmacyId;

    // Lấy thông tin pharmacy để lấy wallet address (và xác thực quyền sở hữu)
    const { PharmacyModel } = await import(
      "../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js"
    );

    // Tìm pharmacy - có thể là _id hoặc user id
    let pharmacy = await PharmacyModel.findById(requestedPharmacyId);
    if (!pharmacy) {
      pharmacy = await PharmacyModel.findOne({ user: requestedPharmacyId });
    }
    if (!pharmacy) {
      throw new Error("Pharmacy không tồn tại");
    }

    const pharmacyEntityId = pharmacy._id?.toString();
    const pharmacyUserId =
      pharmacy.user && pharmacy.user.toString
        ? pharmacy.user.toString()
        : pharmacy.user;

    if (
      contractPharmacyId !== pharmacyEntityId &&
      contractPharmacyId !== pharmacyUserId
    ) {
      throw new Error("Bạn không có quyền xác nhận contract này");
    }

    if (contract.status !== ContractStatus.PENDING) {
      throw new Error(
        `Không thể xác nhận contract với trạng thái ${contract.status}`
      );
    }

    // Lấy user của pharmacy
    const pharmacyUser = await this._userRepository.findById(pharmacy.user);
    if (!pharmacyUser || !pharmacyUser.walletAddress) {
      throw new Error("Pharmacy không có wallet address");
    }

    // If a private key is provided (legacy), call blockchain service to sign/transact.
    if (pharmacyPrivateKey) {
      try {
        const blockchainResult = await this._blockchainService.pharmacyConfirmTheContract(
          pharmacyPrivateKey,
          dto.distributorAddress
        );

        // Cập nhật contract trong database
        contract.approveByPharmacy();
        contract.setBlockchainTxHash(blockchainResult.transactionHash);
        contract.setBlockchainStatus(ContractStatus.APPROVED);
        await this._contractRepository.save(contract);

        return {
          contractId: contract.id,
          status: contract.status,
          blockchainTxHash: contract.blockchainTxHash,
          pharmacySignedAt: contract.pharmacySignedAt,
          message: "Contract đã được pharmacy xác nhận. Đang chờ distributor ký lần cuối.",
        };
      } catch (error) {
        console.error("Lỗi khi gọi smart contract:", error);
        throw new Error(`Lỗi khi xác nhận contract trên blockchain: ${error.message}`);
      }
    }

    // Otherwise, accept an off-chain signature payload: verify signature and
    // mark the contract as approved locally (no on-chain tx executed here).
    if (dto.pharmacySignature && dto.pharmacyAddress && dto.signedMessage) {
      // Verify signature recovers expected wallet address
      try {
        // ethers v6 dùng hàm verifyMessage ở root thay vì ethers.utils
        const recovered = ethers.verifyMessage(
          dto.signedMessage,
          dto.pharmacySignature
        );
        if (!recovered || recovered.toLowerCase() !== pharmacyUser.walletAddress.toLowerCase()) {
          throw new Error("Chữ ký không hợp lệ hoặc không khớp với wallet của pharmacy");
        }

        // Update contract status locally to approved (off-chain signature)
        contract.approveByPharmacy();
        contract.setBlockchainStatus(ContractStatus.PENDING); // still pending on-chain
        // store pharmacySignedAt inside approveByPharmacy implementation
        await this._contractRepository.save(contract);

        return {
          contractId: contract.id,
          status: contract.status,
          blockchainTxHash: contract.blockchainTxHash,
          pharmacySignedAt: contract.pharmacySignedAt,
          message: "Contract đã được pharmacy xác nhận (off-chain). Đang chờ distributor ký lần cuối.",
        };
      } catch (err) {
        console.error("Lỗi khi verify chữ ký off-chain:", err);
        throw new Error(`Chữ ký không hợp lệ: ${err.message}`);
      }
    }

    // Should not reach here due to DTO validation, but guard anyway
    throw new Error("Không có phương thức xác thực hợp lệ được cung cấp");
  }
}

