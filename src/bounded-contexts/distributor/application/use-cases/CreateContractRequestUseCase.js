import { DistributorPharmacyContract, ContractStatus } from "../../domain/aggregates/DistributorPharmacyContract.js";
import { CreateContractRequestDTO } from "../dto/CreateContractRequestDTO.js";

export class CreateContractRequestUseCase {
  constructor(
    contractRepository,
    blockchainService,
    userRepository
  ) {
    this._contractRepository = contractRepository;
    this._blockchainService = blockchainService;
    this._userRepository = userRepository;
  }

  async execute(dto, distributorId, distributorPrivateKey = null) {
    dto.validate();

    // Lấy thông tin distributor và pharmacy để lấy wallet address
    const { DistributorModel, PharmacyModel } = await import("../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js");
    const mongoose = await import("mongoose");
    
    // Tìm distributor để validate và lấy wallet address
    // distributorId từ JWT là userId
    let distributor = await DistributorModel.findOne({ user: distributorId });
    if (!distributor) {
      // Fallback: có thể distributorId là entity ID
      distributor = await DistributorModel.findById(distributorId);
    }
    if (!distributor) {
      throw new Error("Distributor không tồn tại");
    }
    
    // Kiểm tra xem đã có contract pending hoặc approved chưa (trong transaction để tránh race condition)
    const session = await mongoose.default.startSession();
    let contract;
    
    try {
      await session.withTransaction(async () => {
        // Check existing contract trong transaction (dùng userId để check)
        const existingContract = await this._contractRepository.findByDistributorAndPharmacy(
          distributorId, // Dùng userId (từ JWT) để check
          dto.pharmacyId
        );

        if (existingContract && (existingContract.status === ContractStatus.PENDING || existingContract.status === ContractStatus.APPROVED)) {
          throw new Error("Đã có hợp đồng đang chờ xử lý với pharmacy này");
        }
        
        // Lấy user của distributor
        const distributorUser = await this._userRepository.findById(distributor.user);
        if (!distributorUser || !distributorUser.walletAddress) {
          throw new Error("Distributor không có wallet address");
        }

        // Lấy thông tin pharmacy
        const pharmacy = await PharmacyModel.findById(dto.pharmacyId).populate("user");
        if (!pharmacy || !pharmacy.user || !pharmacy.user.walletAddress) {
          throw new Error("Pharmacy không tồn tại hoặc không có wallet address");
        }

        // Tạo contract trong database (dùng userId từ JWT)
        contract = DistributorPharmacyContract.create(
          distributorId, // Dùng userId (từ JWT) thay vì entity ID
          dto.pharmacyId,
          dto.contractFileUrl,
          dto.contractFileName,
          distributorUser.walletAddress,
          pharmacy.user.walletAddress
        );

        // Save trong transaction
        contract = await this._contractRepository.save(contract, { session });
      });
    } catch (error) {
      // Nếu là duplicate key error từ MongoDB unique constraint
      if (error.code === 11000 || error.message.includes("duplicate") || error.message.includes("E11000")) {
        throw new Error("Đã có hợp đồng với pharmacy này");
      }
      throw error;
    } finally {
      await session.endSession();
    }

    // Gọi smart contract để tạo contract trên blockchain (nếu có private key)
    // Làm ngoài transaction vì blockchain call có thể mất thời gian
    if (distributorPrivateKey) {
      try {
        const pharmacy = await PharmacyModel.findById(dto.pharmacyId).populate("user");
        const blockchainResult =
          await this._blockchainService.distributorCreateAContract(
            distributorPrivateKey,
            pharmacy.user.walletAddress
          );

        contract.setBlockchainTxHash(blockchainResult.transactionHash);
        contract.setBlockchainStatus(ContractStatus.PENDING);
        contract = await this._contractRepository.save(contract);
      } catch (error) {
        console.error("Lỗi khi gọi smart contract:", error);
        // Vẫn lưu contract vào database nhưng không có blockchain tx hash
        throw new Error(
          `Lỗi khi tạo contract trên blockchain: ${error.message}`
        );
      }
    } else {
      // Không có private key → đánh dấu contract chưa sync blockchain
      contract.setBlockchainStatus(ContractStatus.NOT_CREATED);
      contract = await this._contractRepository.save(contract);
    }

    return {
      contractId: contract.id,
      status: contract.status,
      blockchainTxHash: contract.blockchainTxHash || null,
      createdAt: contract.createdAt,
      blockchainStatus: contract.blockchainStatus,
    };
  }
}

