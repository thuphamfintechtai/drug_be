import { ethers } from "ethers";
import { loadDeployedAddresses, loadAccessControlABI } from "../../../../infrastructure/config/blockchain.config.js";
import { blockchainConfig } from "../../../../infrastructure/config/blockchain.config.js";

export class BlockchainAdapter {
  constructor() {
    this._provider = null;
    this._signer = null;
    this._accessControlContract = null;
    this._initialize();
  }

  _initialize() {
    try {
      this._provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);

      if (blockchainConfig.privateKey) {
        this._signer = new ethers.Wallet(blockchainConfig.privateKey, this._provider);
        const deployedAddresses = loadDeployedAddresses();
        const accessControlABI = loadAccessControlABI();
        const accessControlAddress = deployedAddresses["DeployModule#accessControlService"];

        if (accessControlAddress && accessControlABI.length > 0) {
          this._accessControlContract = new ethers.Contract(
            accessControlAddress,
            accessControlABI,
            this._signer
          );
        }
      } else {
        console.warn("PRIVATE_KEY không được thiết lập, chỉ có thể đọc từ contract");
      }
    } catch (error) {
      console.error("Lỗi khi khởi tạo blockchain adapter:", error);
    }
  }

  async registerBusinessEntity(role, walletAddress, taxCode, licenseNo) {
    if (!this._accessControlContract || !this._signer) {
      throw new Error("Không có signer để thực hiện giao dịch");
    }

    if (!ethers.isAddress(walletAddress)) {
      throw new Error("Địa chỉ ví không hợp lệ");
    }

    try {
      let tx;
      switch (role) {
        case "pharma_company":
          tx = await this._accessControlContract.addManufacturer(walletAddress, taxCode, licenseNo);
          break;
        case "distributor":
          tx = await this._accessControlContract.addDistributor(walletAddress, taxCode, licenseNo);
          break;
        case "pharmacy":
          tx = await this._accessControlContract.addPharmacy(walletAddress, taxCode, licenseNo);
          break;
        default:
          throw new Error(`Role không hợp lệ: ${role}`);
      }

      console.log("Transaction đã được gửi:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction đã được confirm:", receipt.blockNumber);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        contractAddress: receipt.to,
        receipt,
      };
    } catch (error) {
      console.error(`Lỗi khi đăng ký ${role} trên blockchain:`, error);
      throw error;
    }
  }
}

