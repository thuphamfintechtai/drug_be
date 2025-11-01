import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const deployedAddressesPath = path.join(__dirname, "..", "deployed_addresses.json");
const accessControlABIPath = path.join(__dirname, "..", "DeployModule#accessControlService.json");

const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));
const accessControlABI = JSON.parse(fs.readFileSync(accessControlABIPath, "utf8")).abi;

const accessControlAddress = deployedAddresses["DeployModule#accessControlService"];
const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.warn("PRIVATE_KEY không được thiết lập trong environment variables");
}

let provider;
let signer;
let accessControlContract;

export const initializeBlockchain = () => {
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    
    if (PRIVATE_KEY) {
      signer = new ethers.Wallet(PRIVATE_KEY, provider);
      accessControlContract = new ethers.Contract(
        accessControlAddress,
        accessControlABI,
        signer
      );
      console.log("Blockchain service đã được khởi tạo thành công");
    } else {
      console.warn("Không có private key, chỉ có thể đọc từ contract");
      accessControlContract = new ethers.Contract(
        accessControlAddress,
        accessControlABI,
        provider
      );
    }
  } catch (error) {
    console.error("Lỗi khi khởi tạo blockchain service:", error);
    throw error;
  }
};

export const addManufacturerToBlockchain = async (walletAddress, taxCode, licenseNo) => {
  try {
    if (!accessControlContract) {
      initializeBlockchain();
    }

    if (!signer) {
      throw new Error("Không có signer để thực hiện giao dịch");
    }

    if (!ethers.isAddress(walletAddress)) {
      throw new Error("Địa chỉ ví không hợp lệ");
    }

    const tx = await accessControlContract.addManufacturer(
      walletAddress,
      taxCode,
      licenseNo
    );

    console.log("Transaction đã được gửi:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction đã được confirm:", receipt.blockNumber);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      receipt,
    };
  } catch (error) {
    console.error("Lỗi khi thêm manufacturer vào blockchain:", error);
    throw error;
  }
};

export const addDistributorToBlockchain = async (walletAddress, taxCode, licenseNo) => {
  try {
    if (!accessControlContract) {
      initializeBlockchain();
    }

    if (!signer) {
      throw new Error("Không có signer để thực hiện giao dịch");
    }

    if (!ethers.isAddress(walletAddress)) {
      throw new Error("Địa chỉ ví không hợp lệ");
    }

    const tx = await accessControlContract.addDistributor(
      walletAddress,
      taxCode,
      licenseNo
    );

    console.log("Transaction đã được gửi:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction đã được confirm:", receipt.blockNumber);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      receipt,
    };
  } catch (error) {
    console.error("Lỗi khi thêm distributor vào blockchain:", error);
    throw error;
  }
};

export const addPharmacyToBlockchain = async (walletAddress, taxCode, licenseNo) => {
  try {
    if (!accessControlContract) {
      initializeBlockchain();
    }

    if (!signer) {
      throw new Error("Không có signer để thực hiện giao dịch");
    }

    if (!ethers.isAddress(walletAddress)) {
      throw new Error("Địa chỉ ví không hợp lệ");
    }

    const tx = await accessControlContract.addPharmacy(
      walletAddress,
      taxCode,
      licenseNo
    );

    console.log("Transaction đã được gửi:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction đã được confirm:", receipt.blockNumber);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      receipt,
    };
  } catch (error) {
    console.error("Lỗi khi thêm pharmacy vào blockchain:", error);
    throw error;
  }
};

export const checkIsManufacturer = async (walletAddress) => {
  try {
    if (!accessControlContract) {
      initializeBlockchain();
    }

    const result = await accessControlContract.checkIsManufacturer(walletAddress);
    return result;
  } catch (error) {
    console.error("Lỗi khi kiểm tra manufacturer:", error);
    throw error;
  }
};

export const checkIsDistributor = async (walletAddress) => {
  try {
    if (!accessControlContract) {
      initializeBlockchain();
    }

    const result = await accessControlContract.checkIsDistributor(walletAddress);
    return result;
  } catch (error) {
    console.error("Lỗi khi kiểm tra distributor:", error);
    throw error;
  }
};

export const checkIsPharmacy = async (walletAddress) => {
  try {
    if (!accessControlContract) {
      initializeBlockchain();
    }

    const result = await accessControlContract.checkIsPharmacy(walletAddress);
    return result;
  } catch (error) {
    console.error("Lỗi khi kiểm tra pharmacy:", error);
    throw error;
  }
};

initializeBlockchain();

