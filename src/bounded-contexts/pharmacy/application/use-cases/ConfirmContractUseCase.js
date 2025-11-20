import { ContractStatus } from "../../../distributor/domain/aggregates/DistributorPharmacyContract.js";
import { ConfirmContractDTO } from "../dto/ConfirmContractDTO.js";

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

    if (contract.pharmacyId !== pharmacyId) {
      throw new Error("Bạn không có quyền xác nhận contract này");
    }

    if (contract.status !== ContractStatus.PENDING) {
      throw new Error(`Không thể xác nhận contract với trạng thái ${contract.status}`);
    }

    // Lấy thông tin pharmacy để lấy wallet address
    const { PharmacyModel } = await import("../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js");
    
    // Tìm pharmacy - có thể là _id hoặc user id
    let pharmacy = await PharmacyModel.findById(pharmacyId);
    if (!pharmacy) {
      pharmacy = await PharmacyModel.findOne({ user: pharmacyId });
    }
    if (!pharmacy) {
      throw new Error("Pharmacy không tồn tại");
    }
    
    // Lấy user của pharmacy
    const pharmacyUser = await this._userRepository.findById(pharmacy.user);
    if (!pharmacyUser || !pharmacyUser.walletAddress) {
      throw new Error("Pharmacy không có wallet address");
    }

    // Gọi smart contract để pharmacy xác nhận
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
}

