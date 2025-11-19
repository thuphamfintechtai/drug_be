import { BlockchainAdapter } from "../../../registration/infrastructure/blockchain/BlockchainAdapter.js";

export class AdminBlockchainService {
  constructor() {
    this._blockchainAdapter = new BlockchainAdapter();
  }

  async addManufacturerToBlockchain(walletAddress, taxCode, licenseNo) {
    return await this._blockchainAdapter.registerBusinessEntity("pharma_company", walletAddress, taxCode, licenseNo);
  }

  async addDistributorToBlockchain(walletAddress, taxCode, licenseNo) {
    return await this._blockchainAdapter.registerBusinessEntity("distributor", walletAddress, taxCode, licenseNo);
  }

  async addPharmacyToBlockchain(walletAddress, taxCode, licenseNo) {
    return await this._blockchainAdapter.registerBusinessEntity("pharmacy", walletAddress, taxCode, licenseNo);
  }
}

