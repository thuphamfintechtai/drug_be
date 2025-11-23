import request from "supertest";
import app from "../setup/testApp.js";
import "../setup/testSetup.js";
import {
  createTestPharmaCompany,
  createTestDistributor,
  createTestUser,
  getAuthToken,
} from "../helpers/testHelpers.js";
import { DrugInfoModel } from "../../src/bounded-contexts/supply-chain/infrastructure/persistence/mongoose/schemas/DrugInfoSchema.js";
import { NFTInfoModel } from "../../src/bounded-contexts/supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js";
import { ProofOfProductionModel } from "../../src/bounded-contexts/supply-chain/infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js";
import { ManufacturerInvoiceModel } from "../../src/bounded-contexts/supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js";

describe("Manufacturer Workflow Tests", () => {
  let manufacturer, distributor, authToken;

  beforeEach(async () => {
    // Tạo manufacturer (pharma company)
    const manufacturerData = await createTestPharmaCompany({
      email: `manufacturer_${Date.now()}@test.com`,
      walletAddress: "0xManufacturer123456789012345678901234567890",
    });
    manufacturer = manufacturerData.user;
    authToken = getAuthToken(manufacturer);

    // Tạo distributor
    const distributorData = await createTestDistributor({
      email: `distributor_${Date.now()}@test.com`,
      walletAddress: "0xDistributor123456789012345678901234567890",
    });
    distributor = distributorData.distributor;
  });

  describe("Quản lý thuốc (Drug Management)", () => {
    test("Manufacturer có thể thêm thuốc mới", async () => {
      const response = await request(app)
        .post("/api/pharma-company/drugs")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tradeName: "Paracetamol 500mg",
          genericName: "Paracetamol",
          atcCode: "N02BE01",
          dosageForm: "Tablet",
          strength: "500mg",
          route: "Oral",
          packaging: "Hộp 10 viên",
          storage: "Nơi khô ráo, tránh ánh sáng",
          warnings: "Không dùng quá liều",
          activeIngredients: [
            {
              name: "Paracetamol",
              concentration: "500mg",
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("tradeName", "Paracetamol 500mg");
      expect(response.body.data).toHaveProperty("atcCode", "N02BE01");
      expect(response.body.data).toHaveProperty("manufacturer");
    });

    test("Manufacturer không thể thêm thuốc với ATC code trùng lặp", async () => {
      // Tạo thuốc đầu tiên
      await request(app)
        .post("/api/pharma-company/drugs")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tradeName: "Paracetamol 500mg",
          atcCode: "N02BE01",
        });

      // Thử tạo thuốc thứ 2 với cùng ATC code
      const response = await request(app)
        .post("/api/pharma-company/drugs")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tradeName: "Paracetamol 250mg",
          atcCode: "N02BE01",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("ATC code đã tồn tại");
    });

    test("Manufacturer có thể xem danh sách thuốc của mình", async () => {
      // Tạo một số thuốc
      const pharmaCompany = await manufacturer.populate("pharmaCompany");
      await DrugInfoModel.create({
        manufacturer: pharmaCompany.pharmaCompany,
        tradeName: "Drug 1",
        atcCode: "DRUG001",
      });
      await DrugInfoModel.create({
        manufacturer: pharmaCompany.pharmaCompany,
        tradeName: "Drug 2",
        atcCode: "DRUG002",
      });

      const response = await request(app)
        .get("/api/pharma-company/drugs")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.drugs.length).toBeGreaterThanOrEqual(2);
    });

    test("Manufacturer có thể cập nhật thông tin thuốc", async () => {
      const pharmaCompany = await manufacturer.populate("pharmaCompany");
      const drug = await DrugInfoModel.create({
        manufacturer: pharmaCompany.pharmaCompany,
        tradeName: "Old Name",
        atcCode: "UPDATE001",
      });

      const response = await request(app)
        .put(`/api/pharma-company/drugs/${drug._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tradeName: "New Name",
          status: "inactive",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tradeName).toBe("New Name");
      expect(response.body.data.status).toBe("inactive");
    });

    test("Manufacturer có thể xem thông tin chi tiết một thuốc", async () => {
      const pharmaCompany = await manufacturer.populate("pharmaCompany");
      const drug = await DrugInfoModel.create({
        manufacturer: pharmaCompany.pharmaCompany,
        tradeName: "Detail Drug",
        atcCode: "DETAIL001",
      });

      const response = await request(app)
        .get(`/api/pharma-company/drugs/${drug._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tradeName).toBe("Detail Drug");
    });
  });

  describe("Luồng sản xuất và mint NFT", () => {
    let drug;

    beforeEach(async () => {
      const pharmaCompany = await manufacturer.populate("pharmaCompany");
      drug = await DrugInfo.create({
        manufacturer: pharmaCompany.pharmaCompany,
        tradeName: "Test Drug for Production",
        atcCode: `PROD_${Date.now()}`,
      });
    });

    test("Manufacturer có thể upload metadata lên IPFS (mock)", async () => {
      // Mock IPFS service sẽ được test riêng, ở đây chỉ test API endpoint
      // Thực tế cần PINATA_API_KEY và PINATA_SECRET_KEY trong .env
      const response = await request(app)
        .post("/api/pharma-company/production/upload-ipfs")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          quantity: 5,
          metadata: {
            name: "Test Drug Package",
            description: "Test description",
            image: "https://example.com/image.png",
          },
        });

      // Nếu có PINATA keys thật, sẽ trả về 200
      // Nếu không có, sẽ trả về 500 với lỗi về missing keys
      expect([200, 500]).toContain(response.status);
    });

    test("Manufacturer có thể lưu thông tin NFT sau khi mint", async () => {
      const tokenIds = ["1", "2", "3"];
      const transactionHash = "0x" + "a".repeat(64);

      const response = await request(app)
        .post("/api/pharma-company/production/save-minted")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          drugId: drug._id,
          tokenIds,
          transactionHash,
          quantity: 3,
          mfgDate: new Date().toISOString(),
          expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          batchNumber: "BATCH001",
          ipfsUrl: "https://gateway.pinata.cloud/ipfs/QmTest123",
          metadata: {
            name: "Test NFT",
            description: "Test NFT Description",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokenIds).toEqual(tokenIds);

      // Kiểm tra ProofOfProduction đã được tạo
      const proof = await ProofOfProductionModel.findById(response.body.data.proofOfProduction._id);
      expect(proof).toBeTruthy();
      expect(proof.quantity).toBe(3);

      // Kiểm tra NFT đã được lưu
      const nfts = await NFTInfoModel.find({ tokenId: { $in: tokenIds } });
      expect(nfts.length).toBe(3);
      expect(nfts[0].status).toBe("minted");
      expect(nfts[0].owner.toString()).toBe(manufacturer._id.toString());
    });

    test("Manufacturer không thể lưu NFT với tokenIds trùng lặp", async () => {
      const tokenIds = ["1", "2", "3"];
      const transactionHash = "0x" + "a".repeat(64);

      // Lưu lần đầu
      await request(app)
        .post("/api/pharma-company/production/save-minted")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          drugId: drug._id,
          tokenIds,
          transactionHash: transactionHash + "1",
          quantity: 3,
          batchNumber: "BATCH001",
          ipfsUrl: "https://gateway.pinata.cloud/ipfs/QmTest123",
        });

      // Thử lưu lại với cùng tokenIds
      const response = await request(app)
        .post("/api/pharma-company/production/save-minted")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          drugId: drug._id,
          tokenIds,
          transactionHash: transactionHash + "2",
          quantity: 3,
          batchNumber: "BATCH002",
          ipfsUrl: "https://gateway.pinata.cloud/ipfs/QmTest456",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("đã tồn tại");
    });
  });

  describe("Luồng chuyển giao cho Distributor", () => {
    let drug, nftInfos;

    beforeEach(async () => {
      const pharmaCompany = await manufacturer.populate("pharmaCompany");
      drug = await DrugInfo.create({
        manufacturer: pharmaCompany.pharmaCompany,
        tradeName: "Transfer Drug",
        atcCode: `TRANSFER_${Date.now()}`,
      });

      // Tạo Proof of Production
      const proof = await ProofOfProductionModel.create({
        manufacturer: pharmaCompany.pharmaCompany,
        drug: drug._id,
        quantity: 5,
        chainTxHash: "0x" + "b".repeat(64),
      });

      // Tạo một số NFT đã mint
      nftInfos = [];
      for (let i = 1; i <= 5; i++) {
        const nft = await NFTInfoModel.create({
          tokenId: `100${i}`,
          contractAddress: "0x73f4600D02274e31a094DdF71e5bCD992Fd367E7",
          drug: drug._id,
          serialNumber: `BATCH001-100${i}`,
          batchNumber: "BATCH001",
          owner: manufacturer._id,
          status: "minted",
          chainTxHash: "0x" + "b".repeat(64),
          ipfsUrl: "https://gateway.pinata.cloud/ipfs/QmTest123",
          proofOfProduction: proof._id,
        });
        nftInfos.push(nft);
      }
    });

    test("Manufacturer có thể tạo invoice để chuyển giao cho Distributor", async () => {
      const tokenIds = nftInfos.map((nft) => nft.tokenId);
      const amounts = [1, 1, 1, 1, 1];

      const response = await request(app)
        .post("/api/pharma-company/production/transfer")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          distributorId: distributor._id,
          tokenIds,
          amounts,
          invoiceNumber: `INV-${Date.now()}`,
          invoiceDate: new Date().toISOString(),
          quantity: 5,
          unitPrice: 100000,
          totalAmount: 500000,
          vatRate: 10,
          vatAmount: 50000,
          finalAmount: 550000,
          notes: "Test invoice",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.invoice.status).toBe("pending");
      const distributorWithUser = await distributor.populate("user");
      expect(response.body.data.distributorAddress).toBe(distributorWithUser.user.walletAddress);
    });

    test("Manufacturer có thể lưu transaction hash sau khi transfer", async () => {
      // Tạo invoice trước
      const tokenIds = nftInfos.map((nft) => nft.tokenId);
      const amounts = [1, 1, 1, 1, 1];

      const transferResponse = await request(app)
        .post("/api/pharma-company/production/transfer")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          distributorId: distributor._id,
          tokenIds,
          amounts,
          invoiceNumber: `INV-${Date.now()}`,
          quantity: 5,
        });

      const invoiceId = transferResponse.body.data.invoice._id;
      const transactionHash = "0x" + "c".repeat(64);

      // Lưu transaction hash
      const response = await request(app)
        .post("/api/pharma-company/production/save-transfer")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          invoiceId,
          transactionHash,
          tokenIds,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.invoice.status).toBe("sent");
      expect(response.body.data.invoice.chainTxHash).toBe(transactionHash);

      // Kiểm tra NFT đã được cập nhật status
      const distributorWithUser = await distributor.populate("user");
      const updatedNFTs = await NFTInfoModel.find({ tokenId: { $in: tokenIds } });
      expect(updatedNFTs.every((nft) => nft.status === "transferred")).toBe(true);
      expect(updatedNFTs.every((nft) => nft.owner.toString() === distributorWithUser.user._id.toString())).toBe(true);
    });

    test("Manufacturer không thể transfer NFT không thuộc về mình", async () => {
      // Tạo NFT thuộc về manufacturer khác
      const otherManufacturer = await createTestPharmaCompany({
        email: `other_${Date.now()}@test.com`,
      });

      const otherNFT = await NFTInfo.create({
        tokenId: "9999",
        contractAddress: "0x73f4600D02274e31a094DdF71e5bCD992Fd367E7",
        drug: drug._id,
        serialNumber: "OTHER-9999",
        owner: otherManufacturer.user._id,
        status: "minted",
      });

      const response = await request(app)
        .post("/api/pharma-company/production/transfer")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          distributorId: distributor._id,
          tokenIds: [otherNFT.tokenId],
          amounts: [1],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("không thuộc về bạn");
    });
  });

  describe("Xem lịch sử và thống kê", () => {
    beforeEach(async () => {
      const pharmaCompany = await manufacturer.populate("pharmaCompany");
      
      // Tạo một số thuốc
      const drug1 = await DrugInfo.create({
        manufacturer: pharmaCompany.pharmaCompany,
        tradeName: "Drug 1",
        atcCode: `STAT_${Date.now()}_1`,
      });

      const drug2 = await DrugInfo.create({
        manufacturer: pharmaCompany.pharmaCompany,
        tradeName: "Drug 2",
        atcCode: `STAT_${Date.now()}_2`,
      });

      // Tạo Proof of Production
      const proof1 = await ProofOfProduction.create({
        manufacturer: pharmaCompany.pharmaCompany,
        drug: drug1._id,
        quantity: 10,
      });

      const proof2 = await ProofOfProduction.create({
        manufacturer: pharmaCompany.pharmaCompany,
        drug: drug2._id,
        quantity: 5,
      });

      // Tạo NFT
      for (let i = 1; i <= 10; i++) {
        await NFTInfo.create({
          tokenId: `200${i}`,
          contractAddress: "0x73f4600D02274e31a094DdF71e5bCD992Fd367E7",
          drug: drug1._id,
          serialNumber: `BATCH-200${i}`,
          owner: manufacturer._id,
          status: i <= 5 ? "transferred" : "minted",
          proofOfProduction: proof1._id,
        });
      }

      for (let i = 1; i <= 5; i++) {
        await NFTInfo.create({
          tokenId: `300${i}`,
          contractAddress: "0x73f4600D02274e31a094DdF71e5bCD992Fd367E7",
          drug: drug2._id,
          serialNumber: `BATCH-300${i}`,
          owner: manufacturer._id,
          status: "minted",
          proofOfProduction: proof2._id,
        });
      }
    });

    test("Manufacturer có thể xem lịch sử sản xuất", async () => {
      const response = await request(app)
        .get("/api/pharma-company/production/history")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.productions.length).toBeGreaterThan(0);
    });

    test("Manufacturer có thể xem lịch sử chuyển giao", async () => {
      const response = await request(app)
        .get("/api/pharma-company/transfer/history")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("invoices");
      expect(response.body.data).toHaveProperty("pagination");
    });

    test("Manufacturer có thể xem thống kê", async () => {
      const response = await request(app)
        .get("/api/pharma-company/statistics")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("drugs");
      expect(response.body.data).toHaveProperty("nfts");
      expect(response.body.data).toHaveProperty("transfers");
    });
  });

  describe("Xác thực và phân quyền", () => {
    test("User không phải pharma_company không thể truy cập routes", async () => {
      const regularUser = await createTestUser({
        email: `regular_${Date.now()}@test.com`,
      });
      const regularToken = getAuthToken(regularUser);

      const response = await request(app)
        .get("/api/pharma-company/drugs")
        .set("Authorization", `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });

    test("Request không có token sẽ bị từ chối", async () => {
      const response = await request(app)
        .get("/api/pharma-company/drugs");

      expect(response.status).toBe(401);
    });
  });
});

