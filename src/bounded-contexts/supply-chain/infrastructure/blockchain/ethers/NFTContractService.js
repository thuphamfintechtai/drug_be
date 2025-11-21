import { ethers } from "ethers";
import { loadDeployedAddresses, loadMyNFTABI } from "../../../../../infrastructure/config/blockchain.config.js";
import { blockchainConfig } from "../../../../../infrastructure/config/blockchain.config.js";

export class NFTContractService {
  constructor() {
    this._provider = null;
    this._contract = null;
    this._initialize();
  }

  _initialize() {
    try {
      this._provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
      
      const deployedAddresses = loadDeployedAddresses();
      const myNFTABI = loadMyNFTABI();
      const myNFTAddress = deployedAddresses["DeployModule#MyNFT"];

      if (myNFTAddress && myNFTABI.length > 0) {
        this._contract = new ethers.Contract(myNFTAddress, myNFTABI, this._provider);
      }
    } catch (error) {
      console.error("Lỗi khi khởi tạo NFT contract service:", error);
    }
  }

  getManufacturerSigner(manufacturerPrivateKey) {
    if (!manufacturerPrivateKey) {
      throw new Error("Manufacturer private key không được cung cấp");
    }
    if (!this._provider) {
      this._initialize();
    }
    return new ethers.Wallet(manufacturerPrivateKey, this._provider);
  }

  async mintNFT(manufacturerPrivateKey, amounts) {
    if (!this._contract) {
      throw new Error("NFT contract chưa được khởi tạo");
    }

    if (!manufacturerPrivateKey || !amounts || amounts.length === 0) {
      throw new Error("Manufacturer private key và amounts là bắt buộc");
    }

    const manufacturerSigner = this.getManufacturerSigner(manufacturerPrivateKey);
    const contractWithSigner = new ethers.Contract(
      this._contract.target,
      this._contract.interface,
      manufacturerSigner
    );

    const tx = await contractWithSigner.mintNFT(amounts);
    console.log("Transaction mint NFT đã được gửi:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction mint NFT đã được confirm:", receipt.blockNumber);

    // Parse event để lấy tokenIds
    const event = receipt.logs.find((log) => {
      try {
        const parsed = contractWithSigner.interface.parseLog(log);
        return parsed && parsed.name === "mintNFTEvent";
      } catch {
        return false;
      }
    });

    let tokenIds = [];
    if (event) {
      const parsed = contractWithSigner.interface.parseLog(event);
      tokenIds = parsed.args.tokenIds.map((id) => id.toString());
    }

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      tokenIds,
      receipt,
    };
  }

  async transferToDistributor(manufacturerPrivateKey, tokenIds, amounts, distributorAddress) {
    if (!this._contract) {
      throw new Error("NFT contract chưa được khởi tạo");
    }

    if (!manufacturerPrivateKey || !tokenIds || !amounts || !distributorAddress) {
      throw new Error("Tất cả các tham số là bắt buộc");
    }

    if (!ethers.isAddress(distributorAddress)) {
      throw new Error("Địa chỉ distributor không hợp lệ");
    }

    if (tokenIds.length !== amounts.length) {
      throw new Error("Số lượng tokenIds phải bằng số lượng amounts");
    }

    const manufacturerSigner = this.getManufacturerSigner(manufacturerPrivateKey);
    const contractWithSigner = new ethers.Contract(
      this._contract.target,
      this._contract.interface,
      manufacturerSigner
    );

    const tx = await contractWithSigner.manufacturerTransferToDistributor(
      tokenIds,
      amounts,
      distributorAddress
    );

    console.log("Transaction transfer NFT đã được gửi:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction transfer NFT đã được confirm:", receipt.blockNumber);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      receipt,
    };
  }

  async getTrackingHistory(tokenId) {
    if (!this._contract) {
      throw new Error("NFT contract chưa được khởi tạo");
    }

    const result = await this._contract.getTrackingHistory(tokenId);

    return result.map((track) => ({
      fromUserType: track.fromUserType,
      toUserType: track.toUserType,
      fromUserAddress: track.fromUserAddress,
      toUserAddress: track.toUserAddress,
      receivedTimestamp: Number(track.recivedtimeSpan),
    }));
  }

  async getTokenBalance(ownerAddress, tokenId) {
    if (!this._contract) {
      throw new Error("NFT contract chưa được khởi tạo");
    }

    if (!ethers.isAddress(ownerAddress)) {
      throw new Error("Địa chỉ owner không hợp lệ");
    }

    const balance = await this._contract.balanceOf(ownerAddress, tokenId);
    return balance.toString();
  }
}

