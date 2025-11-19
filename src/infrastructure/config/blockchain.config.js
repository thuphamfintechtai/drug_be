import dotenv from "dotenv";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const blockchainConfig = {
  rpcUrl: process.env.RPC_URL || "http://localhost:8545",
  privateKey: process.env.PRIVATE_KEY,
  deployedAddressesPath: path.join(__dirname, "../../../deployed_addresses.json"),
  accessControlABIPath: path.join(__dirname, "../../../DeployModule#accessControlService.json"),
  myNFTABIPath: path.join(__dirname, "../../../DeployModule#MyNFT.json"),
};

export const loadDeployedAddresses = () => {
  try {
    return JSON.parse(fs.readFileSync(blockchainConfig.deployedAddressesPath, "utf8"));
  } catch (error) {
    console.error("Error loading deployed addresses:", error);
    return {};
  }
};

export const loadAccessControlABI = () => {
  try {
    const abiData = JSON.parse(fs.readFileSync(blockchainConfig.accessControlABIPath, "utf8"));
    return abiData.abi;
  } catch (error) {
    console.error("Error loading AccessControl ABI:", error);
    return [];
  }
};

export const loadMyNFTABI = () => {
  try {
    const abiData = JSON.parse(fs.readFileSync(blockchainConfig.myNFTABIPath, "utf8"));
    return abiData.abi;
  } catch (error) {
    console.error("Error loading MyNFT ABI:", error);
    return [];
  }
};

