import { ContractStatus } from "../../domain/aggregates/DistributorPharmacyContract.js";
import { FinalizeContractDTO } from "../dto/FinalizeContractDTO.js";

export class FinalizeContractAndMintUseCase {
  constructor(
    contractRepository,
    blockchainService,
    userRepository,
    nftRepository
  ) {
    this._contractRepository = contractRepository;
    this._blockchainService = blockchainService;
    this._userRepository = userRepository;
    this._nftRepository = nftRepository;
  }

  async execute(dto, distributorId, distributorPrivateKey) {
    dto.validate();

    // Lấy contract từ database
    const contract = await this._contractRepository.findById(dto.contractId);
    if (!contract) {
      throw new Error("Không tìm thấy contract");
    }

    if (contract.distributorId !== distributorId) {
      throw new Error("Bạn không có quyền finalize contract này");
    }

    if (contract.status !== ContractStatus.APPROVED) {
      throw new Error(`Không thể finalize contract với trạng thái ${contract.status}. Phải là APPROVED`);
    }

    // Nếu có private key => gọi blockchain
    if (distributorPrivateKey) {
      try {
        const blockchainResult =
          await this._blockchainService.distributorFinalizeAndMint(
            distributorPrivateKey,
            dto.pharmacyAddress
          );

        if (!blockchainResult.tokenId) {
          throw new Error("Không nhận được tokenId từ blockchain");
        }

        // Cập nhật contract trong database
        contract.finalizeByDistributor(
          blockchainResult.tokenId,
          blockchainResult.transactionHash
        );
        await this._contractRepository.save(contract);

        return {
          contractId: contract.id,
          status: contract.status,
          tokenId: contract.tokenId,
          blockchainTxHash: contract.blockchainTxHash,
          distributorSignedAt: contract.distributorSignedAt,
          message: "Contract đã được ký và NFT đã được mint thành công.",
        };
      } catch (error) {
        console.error("Lỗi khi gọi smart contract:", error);
        throw new Error(
          `Lỗi khi finalize contract và mint NFT trên blockchain: ${error.message}`
        );
      }
    }

    // Không có private key => chấp nhận dữ liệu off-chain (tokenId/transactionHash tùy chọn)
    // Cho phép frontend truyền tokenId/transactionHash nếu đã mint ở nơi khác, nếu không có thì vẫn finalize nhưng token sẽ null.
    const tokenId = dto.tokenId ?? null;
    const transactionHash = dto.transactionHash ?? null;

    contract.finalizeByDistributor(tokenId, transactionHash);
    await this._contractRepository.save(contract);

    return {
      contractId: contract.id,
      status: contract.status,
      tokenId: contract.tokenId,
      blockchainTxHash: contract.blockchainTxHash,
      distributorSignedAt: contract.distributorSignedAt,
      message:
        "Contract đã được ký (off-chain). Vui lòng cập nhật token/transaction nếu cần.",
    };
  }
}

