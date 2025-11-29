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

    // Nếu contract đã signed, chỉ update tokenId và transactionHash
    if (contract.status === ContractStatus.SIGNED) {
      const tokenId = dto.tokenId ?? null;
      const transactionHash = dto.transactionHash ?? null;

      if (tokenId !== null || transactionHash !== null) {
        contract.updateTokenId(tokenId, transactionHash);
        await this._contractRepository.save(contract);

        return {
          contractId: contract.id,
          status: contract.status,
          tokenId: contract.tokenId,
          blockchainTxHash: contract.blockchainTxHash,
          distributorSignedAt: contract.distributorSignedAt,
          message: "TokenId và transactionHash đã được cập nhật thành công.",
        };
      } else {
        // Contract đã signed và không có tokenId/transactionHash mới
        return {
          contractId: contract.id,
          status: contract.status,
          tokenId: contract.tokenId,
          blockchainTxHash: contract.blockchainTxHash,
          distributorSignedAt: contract.distributorSignedAt,
          message: "Contract đã được ký trước đó.",
        };
      }
    }

    // Contract phải ở trạng thái APPROVED để finalize
    if (contract.status !== ContractStatus.APPROVED) {
      throw new Error(`Không thể finalize contract với trạng thái ${contract.status}. Phải là APPROVED hoặc SIGNED`);
    }

    // Nếu có private key => gọi blockchain
    if (distributorPrivateKey) {
      try {
        const blockchainResult =
          await this._blockchainService.distributorFinalizeAndMint(
            distributorPrivateKey,
            dto.pharmacyAddress
          );

        // Ưu tiên dùng tokenId từ request body nếu có, nếu không thì dùng từ blockchain
        const finalTokenId = dto.tokenId || blockchainResult.tokenId;
        const finalTransactionHash = dto.transactionHash || blockchainResult.transactionHash;

        if (!finalTokenId) {
          throw new Error("Không nhận được tokenId từ blockchain hoặc request body");
        }

        // Cập nhật contract trong database
        contract.finalizeByDistributor(
          finalTokenId,
          finalTransactionHash
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

