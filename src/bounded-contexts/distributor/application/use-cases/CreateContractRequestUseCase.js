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

  async execute(dto, distributorId, distributorPrivateKey) {
    dto.validate();

    // Kiểm tra xem đã có contract pending hoặc approved chưa
    const existingContract = await this._contractRepository.findByDistributorAndPharmacy(
      distributorId,
      dto.pharmacyId
    );

    if (existingContract && (existingContract.status === ContractStatus.PENDING || existingContract.status === ContractStatus.APPROVED)) {
      throw new Error("Đã có hợp đồng đang chờ xử lý với pharmacy này");
    }

    // Lấy thông tin distributor và pharmacy để lấy wallet address
    const { DistributorModel, PharmacyModel } = await import("../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js");
    
    // Tìm distributor - có thể là _id hoặc user id
    let distributor = await DistributorModel.findById(distributorId);
    if (!distributor) {
      distributor = await DistributorModel.findOne({ user: distributorId });
    }
    if (!distributor) {
      throw new Error("Distributor không tồn tại");
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

    // Tạo contract trong database
    const contract = DistributorPharmacyContract.create(
      distributorId,
      dto.pharmacyId,
      dto.contractFileUrl,
      dto.contractFileName,
      distributorUser.walletAddress,
      pharmacy.user.walletAddress
    );

    await this._contractRepository.save(contract);

    // Gọi smart contract để tạo contract trên blockchain
    try {
      const blockchainResult = await this._blockchainService.distributorCreateAContract(
        distributorPrivateKey,
        pharmacy.user.walletAddress
      );

      contract.setBlockchainTxHash(blockchainResult.transactionHash);
      contract.setBlockchainStatus(ContractStatus.PENDING);
      await this._contractRepository.save(contract);
    } catch (error) {
      console.error("Lỗi khi gọi smart contract:", error);
      // Vẫn lưu contract vào database nhưng không có blockchain tx hash
      throw new Error(`Lỗi khi tạo contract trên blockchain: ${error.message}`);
    }

    return {
      contractId: contract.id,
      status: contract.status,
      blockchainTxHash: contract.blockchainTxHash,
      createdAt: contract.createdAt,
    };
  }
}

