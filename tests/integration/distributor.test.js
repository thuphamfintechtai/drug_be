import request from "supertest";
import app from "../setup/testApp.js";
import "../setup/testSetup.js";
import {
  createTestDistributor,
  createTestPharmaCompany,
  createTestPharmacy,
  getAuthToken,
} from "../helpers/testHelpers.js";
import ManufacturerInvoice from "../../models/ManufacturerInvoice.js";
import ProofOfDistribution from "../../models/ProofOfDistribution.js";
import CommercialInvoice from "../../models/CommercialInvoice.js";
import NFTInfo from "../../models/NFTInfo.js";
import DrugInfo from "../../models/DrugInfo.js";
import ProofOfProduction from "../../models/ProofOfProduction.js";
import PharmaCompany from "../../models/PharmaCompany.js";

describe("Distributor Workflow Tests", () => {
  let distributor, manufacturer, pharmacy, authToken;
  let drug, nftInfos, invoice;

  beforeEach(async () => {
    // Tạo distributor
    const distributorData = await createTestDistributor({
      email: `distributor_${Date.now()}@test.com`,
      walletAddress: "0xDistributor123456789012345678901234567890",
    });
    distributor = distributorData.user;
    authToken = getAuthToken(distributor);

    // Tạo manufacturer
    const manufacturerData = await createTestPharmaCompany({
      email: `manufacturer_${Date.now()}@test.com`,
      walletAddress: "0xManufacturer123456789012345678901234567890",
    });
    manufacturer = manufacturerData.user;

    // Tạo pharmacy
    const pharmacyData = await createTestPharmacy({
      email: `pharmacy_${Date.now()}@test.com`,
      walletAddress: "0xPharmacy123456789012345678901234567890",
    });
    pharmacy = pharmacyData.user;

    // Tạo drug và NFT để test
    const pharmaCompany = await PharmaCompany.findOne({ user: manufacturer._id });
    drug = await DrugInfo.create({
      manufacturer: pharmaCompany._id,
      tradeName: "Test Drug for Distributor",
      atcCode: `DIST_${Date.now()}`,
    });

    // Tạo Proof of Production
    const proof = await ProofOfProduction.create({
      manufacturer: pharmaCompany._id,
      drug: drug._id,
      quantity: 5,
      chainTxHash: "0x" + "a".repeat(64),
    });

    // Tạo NFT đã được transferred (manufacturer đã chuyển cho distributor)
    nftInfos = [];
    for (let i = 1; i <= 5; i++) {
      const nft = await NFTInfo.create({
        tokenId: `400${i}`,
        contractAddress: "0x73f4600D02274e31a094DdF71e5bCD992Fd367E7",
        drug: drug._id,
        serialNumber: `DIST-400${i}`,
        batchNumber: "BATCH001",
        owner: distributor._id,
        status: "transferred",
        chainTxHash: "0x" + "b".repeat(64),
        ipfsUrl: "https://gateway.pinata.cloud/ipfs/QmTest123",
        proofOfProduction: proof._id,
      });
      nftInfos.push(nft);
    }

    // Tạo invoice từ manufacturer
    invoice = await ManufacturerInvoice.create({
      fromManufacturer: manufacturer._id,
      toDistributor: distributor._id,
      invoiceNumber: `INV-${Date.now()}`,
      quantity: 5,
      status: "sent", // Đã được manufacturer gửi
      chainTxHash: "0x" + "b".repeat(64),
    });
  });

  describe("Quản lý đơn hàng từ Pharma Company", () => {
    test("Distributor có thể xem danh sách đơn hàng từ manufacturer", async () => {
      const response = await request(app)
        .get("/api/distributor/invoices")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.invoices.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.invoices[0]).toHaveProperty("invoiceNumber");
    });

    test("Distributor có thể xem đơn hàng với filter status", async () => {
      const response = await request(app)
        .get("/api/distributor/invoices?status=sent")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.invoices.every((inv) => inv.status === "sent")).toBe(true);
    });

    test("Distributor có thể xác nhận nhận hàng", async () => {
      const response = await request(app)
        .post("/api/distributor/invoices/confirm-receipt")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          invoiceId: invoice._id,
          receivedBy: {
            name: "Nguyễn Văn A",
            idNumber: "123456789",
          },
          deliveryAddress: {
            street: "123 Test Street",
            city: "Hanoi",
            country: "Vietnam",
          },
          notes: "Đã nhận hàng đầy đủ",
          distributedQuantity: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.proofOfDistribution.status).toBe("confirmed");

      // Kiểm tra ProofOfDistribution đã được tạo
      const proof = await ProofOfDistribution.findOne({
        manufacturerInvoice: invoice._id,
      });
      expect(proof).toBeTruthy();
      expect(proof.status).toBe("confirmed");
    });

    test("Distributor không thể xác nhận invoice không thuộc về mình", async () => {
      // Tạo distributor khác
      const otherDistributor = await createTestDistributor({
        email: `other_dist_${Date.now()}@test.com`,
      });
      const otherToken = getAuthToken(otherDistributor.user);

      const response = await request(app)
        .post("/api/distributor/invoices/confirm-receipt")
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          invoiceId: invoice._id,
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("Distributor không thể xác nhận invoice chưa được sent", async () => {
      // Tạo invoice với status pending
      const pendingInvoice = await ManufacturerInvoice.create({
        fromManufacturer: manufacturer._id,
        toDistributor: distributor._id,
        invoiceNumber: `INV-PENDING-${Date.now()}`,
        status: "pending",
      });

      const response = await request(app)
        .post("/api/distributor/invoices/confirm-receipt")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          invoiceId: pendingInvoice._id,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("chưa được gửi");
    });
  });

  describe("Chuyển tiếp cho Pharmacy", () => {
    test("Distributor có thể tạo invoice để chuyển giao cho Pharmacy", async () => {
      const tokenIds = nftInfos.map((nft) => nft.tokenId);
      const amounts = [1, 1, 1, 1, 1];

      const pharmacyDoc = await pharmacy.populate("pharmacy");

      const response = await request(app)
        .post("/api/distributor/transfer/pharmacy")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          pharmacyId: pharmacyDoc.pharmacy._id,
          drugId: drug._id,
          tokenIds,
          amounts,
          invoiceNumber: `CI-${Date.now()}`,
          quantity: 5,
          unitPrice: 100000,
          totalAmount: 500000,
          vatRate: 10,
          vatAmount: 50000,
          finalAmount: 550000,
          notes: "Test invoice to pharmacy",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.commercialInvoice.status).toBe("draft");
      expect(response.body.data.proofOfPharmacy.status).toBe("pending");
    });

    test("Distributor có thể lưu transaction hash sau khi transfer", async () => {
      // Tạo invoice trước
      const tokenIds = nftInfos.slice(0, 3).map((nft) => nft.tokenId);
      const amounts = [1, 1, 1];

      const pharmacyDoc = await pharmacy.populate("pharmacy");

      const transferResponse = await request(app)
        .post("/api/distributor/transfer/pharmacy")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          pharmacyId: pharmacyDoc.pharmacy._id,
          drugId: drug._id,
          tokenIds,
          amounts,
          invoiceNumber: `CI-${Date.now()}`,
          quantity: 3,
        });

      const invoiceId = transferResponse.body.data.commercialInvoice._id;
      const transactionHash = "0x" + "d".repeat(64);

      // Lưu transaction hash
      const response = await request(app)
        .post("/api/distributor/transfer/pharmacy/save-transaction")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          invoiceId,
          transactionHash,
          tokenIds,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.commercialInvoice.status).toBe("sent");
      expect(response.body.data.commercialInvoice.chainTxHash).toBe(transactionHash);

      // Kiểm tra NFT đã được cập nhật status
      const updatedNFTs = await NFTInfo.find({ tokenId: { $in: tokenIds } });
      expect(updatedNFTs.every((nft) => nft.status === "sold")).toBe(true);
      expect(updatedNFTs.every((nft) => nft.owner.toString() === pharmacy._id.toString())).toBe(true);
    });

    test("Distributor không thể transfer NFT không thuộc về mình", async () => {
      // Tạo NFT thuộc về distributor khác
      const otherDistributor = await createTestDistributor({
        email: `other_dist2_${Date.now()}@test.com`,
      });

      const otherNFT = await NFTInfo.create({
        tokenId: "99999",
        contractAddress: "0x73f4600D02274e31a094DdF71e5bCD992Fd367E7",
        drug: drug._id,
        serialNumber: "OTHER-99999",
        owner: otherDistributor.user._id,
        status: "transferred",
      });

      const pharmacyDoc = await pharmacy.populate("pharmacy");

      const response = await request(app)
        .post("/api/distributor/transfer/pharmacy")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          pharmacyId: pharmacyDoc.pharmacy._id,
          drugId: drug._id,
          tokenIds: [otherNFT.tokenId],
          amounts: [1],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("không thuộc về bạn");
    });
  });

  describe("Lịch sử phân phối", () => {
    beforeEach(async () => {
      // Tạo Proof of Distribution
      await ProofOfDistribution.create({
        fromManufacturer: manufacturer._id,
        toDistributor: distributor._id,
        manufacturerInvoice: invoice._id,
        status: "confirmed",
        distributedQuantity: 5,
      });
    });

    test("Distributor có thể xem lịch sử phân phối", async () => {
      const response = await request(app)
        .get("/api/distributor/distribution/history")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.distributions.length).toBeGreaterThanOrEqual(1);
    });

    test("Distributor có thể xem lịch sử chuyển giao cho Pharmacy", async () => {
      // Tạo commercial invoice
      const pharmacyDoc = await pharmacy.populate("pharmacy");
      const tokenIds = nftInfos.slice(0, 2).map((nft) => nft.tokenId);

      await CommercialInvoice.create({
        fromDistributor: distributor._id,
        toPharmacy: pharmacy._id,
        drug: drug._id,
        invoiceNumber: `CI-HISTORY-${Date.now()}`,
        status: "sent",
      });

      const response = await request(app)
        .get("/api/distributor/transfer/history")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.invoices.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Thống kê", () => {
    beforeEach(async () => {
      // Tạo thêm một số dữ liệu để test
      await ProofOfDistribution.create({
        fromManufacturer: manufacturer._id,
        toDistributor: distributor._id,
        manufacturerInvoice: invoice._id,
        status: "confirmed",
      });

      const pharmacyDoc = await pharmacy.populate("pharmacy");
      await CommercialInvoice.create({
        fromDistributor: distributor._id,
        toPharmacy: pharmacy._id,
        drug: drug._id,
        invoiceNumber: `CI-STATS-${Date.now()}`,
        status: "sent",
      });
    });

    test("Distributor có thể xem thống kê", async () => {
      const response = await request(app)
        .get("/api/distributor/statistics")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("invoices");
      expect(response.body.data).toHaveProperty("distributions");
      expect(response.body.data).toHaveProperty("transfersToPharmacy");
      expect(response.body.data).toHaveProperty("nfts");
    });
  });

  describe("Theo dõi hành trình", () => {
    test("Distributor có thể theo dõi hành trình thuốc qua NFT ID", async () => {
      const tokenId = nftInfos[0].tokenId;

      const response = await request(app)
        .get(`/api/distributor/track/${tokenId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("nft");
      expect(response.body.data.nft.tokenId).toBe(tokenId);
    });

    test("Distributor không thể theo dõi NFT không tồn tại", async () => {
      const response = await request(app)
        .get("/api/distributor/track/999999")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Quản lý thuốc", () => {
    beforeEach(async () => {
      // Tạo thêm một số thuốc để test
      const pharmaCompany = await PharmaCompany.findOne({ user: manufacturer._id });
      await DrugInfo.create({
        manufacturer: pharmaCompany._id,
        tradeName: "Drug A",
        atcCode: `DRUGA_${Date.now()}`,
      });
      await DrugInfo.create({
        manufacturer: pharmaCompany._id,
        tradeName: "Drug B",
        atcCode: `DRUGB_${Date.now()}`,
      });
    });

    test("Distributor có thể xem danh sách thuốc", async () => {
      const response = await request(app)
        .get("/api/distributor/drugs")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.drugs.length).toBeGreaterThan(0);
    });

    test("Distributor có thể tìm kiếm thuốc theo ATC code", async () => {
      const response = await request(app)
        .get(`/api/distributor/drugs/search?atcCode=${drug.atcCode}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.atcCode).toBe(drug.atcCode);
    });

    test("Distributor không tìm thấy thuốc với ATC code không tồn tại", async () => {
      const response = await request(app)
        .get("/api/distributor/drugs/search?atcCode=NONEXISTENT")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Quản lý thông tin cá nhân", () => {
    test("Distributor có thể xem thông tin cá nhân", async () => {
      const response = await request(app)
        .get("/api/distributor/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("distributor");
      expect(response.body.data.user.email).toBe(distributor.email);
    });
  });

  describe("Danh sách Pharmacies", () => {
    test("Distributor có thể xem danh sách pharmacies", async () => {
      const response = await request(app)
        .get("/api/distributor/pharmacies")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pharmacies.length).toBeGreaterThan(0);
    });
  });

  describe("Xác thực và phân quyền", () => {
    test("User không phải distributor không thể truy cập routes", async () => {
      const regularUser = await createTestPharmaCompany({
        email: `regular_${Date.now()}@test.com`,
      });
      const regularToken = getAuthToken(regularUser.user);

      const response = await request(app)
        .get("/api/distributor/invoices")
        .set("Authorization", `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });

    test("Request không có token sẽ bị từ chối", async () => {
      const response = await request(app)
        .get("/api/distributor/invoices");

      expect(response.status).toBe(401);
    });
  });
});



