import { ethers } from "ethers";
import { loadDeployedAddresses, loadMyNFTABI } from "../../../../infrastructure/config/blockchain.config.js";
import { blockchainConfig } from "../../../../infrastructure/config/blockchain.config.js";

export class ContractBlockchainService {
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
      console.error("Lỗi khi khởi tạo Contract blockchain service:", error);
    }
  }

  getSigner(privateKey) {
    if (!privateKey) {
      throw new Error("Private key không được cung cấp");
    }
    if (!this._provider) {
      this._initialize();
    }
    return new ethers.Wallet(privateKey, this._provider);
  }

  async distributorCreateAContract(distributorPrivateKey, pharmacyAddress) {
    if (!this._contract) {
      throw new Error("NFT contract chưa được khởi tạo");
    }

    if (!distributorPrivateKey || !pharmacyAddress) {
      throw new Error("Distributor private key và pharmacy address là bắt buộc");
    }

    if (!ethers.isAddress(pharmacyAddress)) {
      throw new Error("Địa chỉ pharmacy không hợp lệ");
    }

    const distributorSigner = this.getSigner(distributorPrivateKey);
    const contractWithSigner = new ethers.Contract(
      this._contract.target,
      this._contract.interface,
      distributorSigner
    );

    const tx = await contractWithSigner.distributorCreateAContract(pharmacyAddress);
    console.log("Transaction distributorCreateAContract đã được gửi:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction distributorCreateAContract đã được confirm:", receipt.blockNumber);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      receipt,
    };
  }

  async pharmacyConfirmTheContract(pharmacyPrivateKey, distributorAddress) {
    if (!this._contract) {
      throw new Error("NFT contract chưa được khởi tạo");
    }

    if (!pharmacyPrivateKey || !distributorAddress) {
      throw new Error("Pharmacy private key và distributor address là bắt buộc");
    }

    if (!ethers.isAddress(distributorAddress)) {
      throw new Error("Địa chỉ distributor không hợp lệ");
    }

    const pharmacySigner = this.getSigner(pharmacyPrivateKey);
    const contractWithSigner = new ethers.Contract(
      this._contract.target,
      this._contract.interface,
      pharmacySigner
    );

    const tx = await contractWithSigner.pharmacyConfirmTheContract(distributorAddress);
    console.log("Transaction pharmacyConfirmTheContract đã được gửi:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction pharmacyConfirmTheContract đã được confirm:", receipt.blockNumber);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      receipt,
    };
  }

  async distributorFinalizeAndMint(distributorPrivateKey, pharmacyAddress) {
    if (!this._contract) {
      throw new Error("NFT contract chưa được khởi tạo");
    }

    if (!distributorPrivateKey || !pharmacyAddress) {
      throw new Error("Distributor private key và pharmacy address là bắt buộc");
    }

    if (!ethers.isAddress(pharmacyAddress)) {
      throw new Error("Địa chỉ pharmacy không hợp lệ");
    }

    const distributorSigner = this.getSigner(distributorPrivateKey);
    const contractWithSigner = new ethers.Contract(
      this._contract.target,
      this._contract.interface,
      distributorSigner
    );

    const tx = await contractWithSigner.distributorFinalizeAndMint(pharmacyAddress);
    console.log("Transaction distributorFinalizeAndMint đã được gửi:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction distributorFinalizeAndMint đã được confirm:", receipt.blockNumber);

    // Parse event để lấy tokenId
    let tokenId = null;
    const event = receipt.logs.find((log) => {
      try {
        const parsed = contractWithSigner.interface.parseLog(log);
        return parsed && parsed.name === "distributorFinalizeAndMintEvent";
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = contractWithSigner.interface.parseLog(event);
      tokenId = parsed.args.tokenId ? Number(parsed.args.tokenId) : null;
    }

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      tokenId,
      receipt,
    };
  }

  async getContractInfoByDistributor(distributorAddress, pharmacyAddress) {
    if (!this._contract) {
      throw new Error("NFT contract chưa được khởi tạo");
    }

    if (!ethers.isAddress(distributorAddress) || !ethers.isAddress(pharmacyAddress)) {
      throw new Error("Địa chỉ không hợp lệ");
    }

    const result = await this._contract.distributorGetContractByPharmacyAddress(pharmacyAddress);
    
    return {
      distributorAddress: result.distributorAddress,
      pharmacyAddress: result.pharmacyAddress,
      contractStatus: result.contractStatus,
    };
  }

  async getContractInfoByPharmacy(pharmacyAddress, distributorAddress) {
    if (!this._contract) {
      throw new Error("NFT contract chưa được khởi tạo");
    }

    if (!ethers.isAddress(distributorAddress) || !ethers.isAddress(pharmacyAddress)) {
      throw new Error("Địa chỉ không hợp lệ");
    }

    const result = await this._contract.pharmacyGetContractInfoByDistributorAddress(distributorAddress);
    
    return {
      distributorAddress: result.distributorAddress,
      pharmacyAddress: result.pharmacyAddress,
      contractStatus: result.contractStatus,
    };
  }
}

