import { GetBatchJourneyDTO } from "../dto/GetBatchJourneyDTO.js";
import { ProofOfProductionModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js";
import { NFTInfoModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js";
import { ManufacturerInvoiceModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js";
import { ProofOfDistributionModel } from "../../../distributor/infrastructure/persistence/mongoose/schemas/ProofOfDistributionSchema.js";
import { CommercialInvoiceModel } from "../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js";
import { ProofOfPharmacyModel } from "../../../pharmacy/infrastructure/persistence/mongoose/schemas/ProofOfPharmacySchema.js";
import {
  PharmaCompanyModel,
  DistributorModel,
  PharmacyModel,
} from "../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js";

export class GetBatchJourneyUseCase {
  async execute(dto) {
    dto.validate();

    const production = await ProofOfProductionModel.findOne({
      batchNumber: dto.batchNumber,
    })
      .populate("manufacturer", "name licenseNo taxCode address country walletAddress")
      .populate("drug", "drugName registrationNo activeIngredient dosageForm strength")
      .lean();

    if (!production) {
      throw new Error("Không tìm thấy batch với batchNumber này");
    }

    const nfts = await NFTInfoModel.find({ batchNumber: dto.batchNumber })
      .populate("owner", "username email role")
      .lean();
    const nftIds = nfts.map((n) => n._id);

    const manufacturerInvoices = await ManufacturerInvoiceModel.find({
      $or: [
        { proofOfProduction: production._id },
        { nftInfo: { $in: nftIds } },
      ],
    })
      .populate("fromManufacturer", "username email")
      .populate("toDistributor", "username email")
      .populate("nftInfo", "tokenId serialNumber status")
      .lean();

    const distributionProofs = await ProofOfDistributionModel.find({
      $or: [
        { proofOfProduction: production._id },
        {
          manufacturerInvoice: { $in: manufacturerInvoices.map((i) => i._id) },
        },
        { nftInfo: { $in: nftIds } },
      ],
    })
      .populate("fromManufacturer", "username email")
      .populate("toDistributor", "username email")
      .populate("nftInfo", "tokenId serialNumber status")
      .populate("manufacturerInvoice", "invoiceNumber status")
      .lean();

    const commercialInvoices = await CommercialInvoiceModel.find({
      nftInfo: { $in: nftIds },
    })
      .populate("fromDistributor", "username email")
      .populate("toPharmacy", "username email")
      .populate("nftInfo", "tokenId serialNumber status")
      .populate("proofOfPharmacy")
      .lean();

    const pharmacyProofs = await ProofOfPharmacyModel.find({
      $or: [
        {
          proofOfDistribution: {
            $in: distributionProofs.map((d) => d._id),
          },
        },
        {
          commercialInvoice: { $in: commercialInvoices.map((c) => c._id) },
        },
        { nftInfo: { $in: nftIds } },
      ],
    })
      .populate("fromDistributor", "username email")
      .populate("toPharmacy", "username email")
      .populate("nftInfo", "tokenId serialNumber status")
      .populate("commercialInvoice", "invoiceNumber status")
      .lean();

    const manufacturerDetails = await PharmaCompanyModel.findOne({
      user: production.manufacturer._id,
    }).lean();

    const distributorUserIds = [
      ...new Set([
        ...manufacturerInvoices.map((inv) => inv.toDistributor?._id?.toString()),
        ...distributionProofs.map((dp) => dp.toDistributor?._id?.toString()),
      ].filter(Boolean)),
    ];
    const distributorDetails = await DistributorModel.find({
      user: { $in: distributorUserIds },
    })
      .populate("user", "username email")
      .lean();

    const pharmacyUserIds = [
      ...new Set([
        ...commercialInvoices.map((inv) => inv.toPharmacy?._id?.toString()),
        ...pharmacyProofs.map((pp) => pp.toPharmacy?._id?.toString()),
      ].filter(Boolean)),
    ];
    const pharmacyDetails = await PharmacyModel.find({
      user: { $in: pharmacyUserIds },
    })
      .populate("user", "username email")
      .lean();

    const timeline = [];
    timeline.push({
      step: 1,
      stage: "production",
      timestamp: production.createdAt,
      entity: {
        type: "pharma_company",
        name: production.manufacturer.name,
        licenseNo: manufacturerDetails?.licenseNo,
        address: manufacturerDetails?.address,
        walletAddress: production.manufacturer.walletAddress,
      },
      details: {
        batchNumber: production.batchNumber,
        drug: production.drug,
        quantity: production.quantity,
        mfgDate: production.mfgDate,
        expDate: production.expDate,
        qaInspector: production.qaInspector,
        qaReportUri: production.qaReportUri,
        chainTxHash: production.chainTxHash,
      },
      nftsMinted: nfts.length,
      status: "completed",
    });

    manufacturerInvoices.forEach((invoice, index) => {
      const distributorDetail = distributorDetails.find(
        (d) =>
          d.user._id.toString() === invoice.toDistributor?._id?.toString()
      );
      const proof = distributionProofs.find(
        (dp) =>
          dp.manufacturerInvoice?._id?.toString() === invoice._id.toString()
      );

      timeline.push({
        step: 2 + index * 2,
        stage: "transfer_to_distributor",
        timestamp: invoice.createdAt,
        entity: {
          type: "distributor",
          name: distributorDetail?.name,
          licenseNo: distributorDetail?.licenseNo,
          address: distributorDetail?.address,
          walletAddress: invoice.toDistributor?.walletAddress,
        },
        details: {
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          quantity: invoice.quantity,
          nfts: invoice.nftInfo,
          deliveryAddress: invoice.deliveryInfo?.address,
          shippingMethod: invoice.deliveryInfo?.shippingMethod,
          estimatedDelivery: invoice.deliveryInfo?.estimatedDelivery,
          chainTxHash: invoice.chainTxHash,
          status: invoice.status,
        },
        proof: proof
          ? {
              receivedAt: proof.verifiedAt,
              receivedBy: proof.receivedBy,
              verificationCode: proof.verificationCode,
              deliveryAddress: proof.deliveryAddress,
              status: proof.status,
              transferTxHash: proof.transferTxHash,
            }
          : null,
      });
    });

    commercialInvoices.forEach((invoice, index) => {
      const pharmacyDetail = pharmacyDetails.find(
        (p) => p.user._id.toString() === invoice.toPharmacy?._id?.toString()
      );
      const proof = pharmacyProofs.find(
        (pp) =>
          pp.commercialInvoice?._id?.toString() === invoice._id.toString()
      );

      timeline.push({
        step: 2 + manufacturerInvoices.length * 2 + index * 2,
        stage: "transfer_to_pharmacy",
        timestamp: invoice.createdAt,
        entity: {
          type: "pharmacy",
          name: pharmacyDetail?.name,
          licenseNo: pharmacyDetail?.licenseNo,
          address: pharmacyDetail?.address,
          walletAddress: invoice.toPharmacy?.walletAddress,
        },
        details: {
          invoiceNumber: invoice.invoiceNumber,
          quantity: invoice.quantity,
          nfts: invoice.nftInfo,
          deliveryAddress: invoice.deliveryInfo?.address,
          shippingMethod: invoice.deliveryInfo?.shippingMethod,
          estimatedDelivery: invoice.deliveryInfo?.estimatedDelivery,
          chainTxHash: invoice.chainTxHash,
          supplyChainCompleted: invoice.supplyChainCompleted,
          status: invoice.status,
        },
        proof: proof
          ? {
              receivedAt: proof.completedAt,
              receivedBy: proof.receivedBy,
              receiptAddress: proof.receiptAddress,
              qualityCheck: proof.qualityCheck,
              status: proof.status,
              receiptTxHash: proof.receiptTxHash,
              supplyChainCompleted: proof.supplyChainCompleted,
            }
          : null,
      });
    });

    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const statistics = {
      totalNFTs: nfts.length,
      nftsByStatus: {
        minted: nfts.filter((n) => n.status === "minted").length,
        transferred: nfts.filter((n) => n.status === "transferred").length,
        sold: nfts.filter((n) => n.status === "sold").length,
        expired: nfts.filter((n) => n.status === "expired").length,
        recalled: nfts.filter((n) => n.status === "recalled").length,
      },
      distributorsInvolved: distributorDetails.length,
      pharmaciesInvolved: pharmacyDetails.length,
      transfersToDistributors: manufacturerInvoices.length,
      transfersToPharmacies: commercialInvoices.length,
      completedSupplyChains: commercialInvoices.filter(
        (inv) => inv.supplyChainCompleted
      ).length,
    };

    const journey = {
      batchInfo: {
        batchNumber: production.batchNumber,
        drug: production.drug,
        manufacturer: { ...production.manufacturer, ...manufacturerDetails },
        mfgDate: production.mfgDate,
        expDate: production.expDate,
        quantity: production.quantity,
        chainTxHash: production.chainTxHash,
        createdAt: production.createdAt,
      },
      timeline,
      nfts: nfts.map((nft) => ({
        tokenId: nft.tokenId,
        serialNumber: nft.serialNumber,
        status: nft.status,
        currentOwner: nft.owner,
      })),
      statistics,
      entities: {
        manufacturer: manufacturerDetails,
        distributors: distributorDetails,
        pharmacies: pharmacyDetails,
      },
    };

    return journey;
  }
}

