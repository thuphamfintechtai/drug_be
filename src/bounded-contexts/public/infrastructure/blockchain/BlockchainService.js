import { NFTContractService } from "../../../supply-chain/infrastructure/blockchain/ethers/NFTContractService.js";

export class BlockchainService {
  constructor() {
    this._nftContractService = new NFTContractService();
  }

  async getTrackingHistory(tokenId) {
    try {
      return await this._nftContractService.getTrackingHistory(tokenId);
    } catch (error) {
      console.error("Lỗi khi lấy blockchain history:", error);
      throw error;
    }
  }
}

