import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
// Use schema models from bounded contexts instead of old models
import { CommercialInvoiceModel } from "../../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js";
import { ProofOfPharmacyModel } from "../../../../pharmacy/infrastructure/persistence/mongoose/schemas/ProofOfPharmacySchema.js";
import { ProofOfProductionModel } from "../../../../supply-chain/infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js";
import { NFTInfoModel } from "../../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js";
import { UserModel } from "../../../../identity-access/infrastructure/persistence/mongoose/schemas/UserSchema.js";
import { ProofOfDistributionModel } from "../../../../distributor/infrastructure/persistence/mongoose/schemas/ProofOfDistributionSchema.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const deployedAddressesPath = path.join(__dirname, "../../../../../../deployed_addresses.json");
const myNFTABIPath = path.join(__dirname, "../../../../../../DeployModule#MyNFT.json");

export class BlockchainEventListener {
  constructor() {
    this._provider = null;
    this._contract = null;
    this._initialize();
  }

  _initialize() {
    try {
      const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));
      const myNFTABI = JSON.parse(fs.readFileSync(myNFTABIPath, "utf8")).abi;
      const myNFTAddress = deployedAddresses["DeployModule#MyNFT"];
      const RPC_URL = process.env.RPC_URL || "http://localhost:8545";

      this._provider = new ethers.JsonRpcProvider(RPC_URL);
      this._contract = new ethers.Contract(myNFTAddress, myNFTABI, this._provider);

      console.log("Blockchain event listener đã được khởi tạo thành công");
    } catch (error) {
      console.error("Lỗi khi khởi tạo blockchain event listener:", error);
      throw error;
    }
  }

  async listenToDistributorToPharmacyEvent() {
    try {
      if (!this._contract) {
        this._initialize();
      }

      console.log("Đang lắng nghe event DistributorToPharmacy...");

      // Lắng nghe event từ block hiện tại
      this._contract.on("DistributorToPharmacy", async (...args) => {
        try {
          // Trong ethers v6, tham số cuối cùng là event log object
          const eventLog = args[args.length - 1];
          const distributorAddress = args[0];
          const pharmacyAddress = args[1];
          const tokenIds = args[2];
          const receivedTimestamp = args[3];

          // Lấy transaction hash từ event log
          const transactionHash =
            eventLog?.log?.transactionHash ||
            eventLog?.transactionHash ||
            eventLog?.hash ||
            eventLog?.txHash;

          console.log("Nhận được event DistributorToPharmacy:");
          console.log("Distributor:", distributorAddress);
          console.log("Pharmacy:", pharmacyAddress);
          console.log("Token IDs:", tokenIds.map((id) => id.toString()));
          console.log("Timestamp:", receivedTimestamp.toString());
          console.log("Transaction Hash:", transactionHash || "UNDEFINED");

          // Chuyển đổi timestamp
          const timestamp = Number(receivedTimestamp.toString()) * 1000;
          const transferDate = new Date(timestamp);

          // Tìm Distributor và Pharmacy trong database
          const distributor = await UserModel.findOne({
            walletAddress: distributorAddress.toLowerCase(),
            role: "distributor",
          });

          const pharmacy = await UserModel.findOne({
            walletAddress: pharmacyAddress.toLowerCase(),
            role: "pharmacy",
          });

          if (!distributor || !pharmacy) {
            console.warn("Không tìm thấy distributor hoặc pharmacy trong database");
            return;
          }

          // Xử lý từng tokenId
          for (const tokenId of tokenIds) {
            const tokenIdStr = tokenId.toString();

            // Tìm NFTInfo với tokenId này
            const nftInfo = await NFTInfoModel.findOne({ tokenId: tokenIdStr });

            if (!nftInfo) {
              console.warn(`Không tìm thấy NFTInfo với tokenId: ${tokenIdStr}`);
              continue;
            }

            // Tìm CommercialInvoice liên quan
            let commercialInvoice = await CommercialInvoiceModel.findOne({
              fromDistributor: distributor._id,
              toPharmacy: pharmacy._id,
              nftInfo: nftInfo._id,
            });

            if (!commercialInvoice) {
              // Tạo mới CommercialInvoice nếu chưa có
              const drug = nftInfo.drug;
              commercialInvoice = new CommercialInvoiceModel({
                fromDistributor: distributor._id,
                toPharmacy: pharmacy._id,
                drug: drug,
                nftInfo: nftInfo._id,
                invoiceNumber: `CI-${Date.now()}-${tokenIdStr}`,
                invoiceDate: transferDate,
                quantity: nftInfo.quantity || 1,
                status: "sent",
                chainTxHash: transactionHash,
                tokenIds: [tokenIdStr],
              });

              await commercialInvoice.save();
            } else {
              // Cập nhật CommercialInvoice nếu đã có
              if (!commercialInvoice.chainTxHash) {
                commercialInvoice.chainTxHash = transactionHash;
              }
              if (!commercialInvoice.tokenIds.includes(tokenIdStr)) {
                commercialInvoice.tokenIds.push(tokenIdStr);
              }
              commercialInvoice.status = "sent";
              await commercialInvoice.save();
            }

            // Tìm hoặc tạo ProofOfPharmacy
            let proofOfPharmacy = await ProofOfPharmacyModel.findOne({
              fromDistributor: distributor._id,
              toPharmacy: pharmacy._id,
              nftInfo: nftInfo._id,
            });

            if (!proofOfPharmacy) {
              // Tìm ProofOfDistribution liên quan
              const proofOfDistribution = await ProofOfDistributionModel.findOne({
                nftInfo: nftInfo._id,
              });

              proofOfPharmacy = new ProofOfPharmacyModel({
                fromDistributor: distributor._id,
                toPharmacy: pharmacy._id,
                proofOfDistribution: proofOfDistribution?._id,
                nftInfo: nftInfo._id,
                drug: nftInfo.drug,
                receiptDate: transferDate,
                receivedQuantity: nftInfo.quantity || 1,
                status: "received",
                chainTxHash: transactionHash,
                receiptTxHash: transactionHash,
                commercialInvoice: commercialInvoice._id,
                batchNumber: nftInfo.batchNumber,
              });

              await proofOfPharmacy.save();
            } else {
              // Cập nhật ProofOfPharmacy
              if (!proofOfPharmacy.receiptDate) {
                proofOfPharmacy.receiptDate = transferDate;
              }
              if (!proofOfPharmacy.chainTxHash) {
                proofOfPharmacy.chainTxHash = transactionHash;
              }
              if (!proofOfPharmacy.receiptTxHash) {
                proofOfPharmacy.receiptTxHash = transactionHash;
              }
              proofOfPharmacy.status = "received";
              await proofOfPharmacy.save();
            }

            // Cập nhật NFTInfo
            nftInfo.owner = pharmacy._id;
            nftInfo.status = "transferred";
            if (!nftInfo.chainTxHash) {
              nftInfo.chainTxHash = transactionHash;
            }
            await nftInfo.save();

            console.log(`Đã xử lý NFT tokenId: ${tokenIdStr}`);
          }

          console.log("Đã xử lý event DistributorToPharmacy thành công");
        } catch (error) {
          console.error("Lỗi khi xử lý event DistributorToPharmacy:", error);
        }
      });
    } catch (error) {
      console.error("Lỗi khi lắng nghe event DistributorToPharmacy:", error);
      throw error;
    }
  }
}

// Export singleton instance để backward compatibility
export const listenToDistributorToPharmacyEvent = async () => {
  const listener = new BlockchainEventListener();
  await listener.listenToDistributorToPharmacyEvent();
  return listener;
};

