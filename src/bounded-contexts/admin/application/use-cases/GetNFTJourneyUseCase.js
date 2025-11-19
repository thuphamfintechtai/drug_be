import { GetNFTJourneyDTO } from "../dto/GetNFTJourneyDTO.js";
import { NFTInfoModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js";
import { ProofOfProductionModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js";
import { ManufacturerInvoiceModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js";
import { ProofOfDistributionModel } from "../../../distributor/infrastructure/persistence/mongoose/schemas/ProofOfDistributionSchema.js";
import { CommercialInvoiceModel } from "../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js";
import { ProofOfPharmacyModel } from "../../../pharmacy/infrastructure/persistence/mongoose/schemas/ProofOfPharmacySchema.js";
import {
  DistributorModel,
  PharmacyModel,
} from "../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js";

export class GetNFTJourneyUseCase {
  async execute(dto) {
    dto.validate();

    const nft = await NFTInfoModel.findOne({ tokenId: dto.tokenId })
      .populate("owner", "username email role")
      .populate("proofOfProduction")
      .lean();

    if (!nft) {
      throw new Error("Không tìm thấy NFT với tokenId này");
    }

    const production = await ProofOfProductionModel.findById(
      nft.proofOfProduction
    )
      .populate(
        "manufacturer",
        "name licenseNo taxCode address country walletAddress"
      )
      .populate("drug", "drugName registrationNo activeIngredient dosageForm strength")
      .lean();

    const timeline = [];
    timeline.push({
      step: 1,
      stage: "production",
      timestamp: production.createdAt,
      entity: {
        type: "pharma_company",
        name: production.manufacturer.name,
        address: production.manufacturer.address,
      },
      details: {
        batchNumber: production.batchNumber,
        tokenId: nft.tokenId,
        serialNumber: nft.serialNumber,
        mfgDate: production.mfgDate,
        expDate: production.expDate,
      },
    });

    const manufacturerInvoices = await ManufacturerInvoiceModel.find({
      nftInfo: nft._id,
    })
      .populate("toDistributor", "username email")
      .lean();

    for (const invoice of manufacturerInvoices) {
      const distributorDetail = await DistributorModel.findOne({
        user: invoice.toDistributor?._id,
      }).lean();
      const proof = await ProofOfDistributionModel.findOne({
        manufacturerInvoice: invoice._id,
        nftInfo: nft._id,
      }).lean();

      timeline.push({
        step: timeline.length + 1,
        stage: "transfer_to_distributor",
        timestamp: invoice.createdAt,
        entity: {
          type: "distributor",
          name: distributorDetail?.name,
          address: distributorDetail?.address,
        },
        details: {
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          deliveryAddress: invoice.deliveryInfo?.address,
        },
        proof: proof
          ? {
              receivedAt: proof.verifiedAt,
              receivedBy: proof.receivedBy,
              status: proof.status,
            }
          : null,
      });
    }

    const commercialInvoices = await CommercialInvoiceModel.find({
      nftInfo: nft._id,
    })
      .populate("toPharmacy", "username email")
      .lean();

    for (const invoice of commercialInvoices) {
      const pharmacyDetail = await PharmacyModel.findOne({
        user: invoice.toPharmacy?._id,
      }).lean();
      const proof = await ProofOfPharmacyModel.findOne({
        commercialInvoice: invoice._id,
        nftInfo: nft._id,
      }).lean();

      timeline.push({
        step: timeline.length + 1,
        stage: "transfer_to_pharmacy",
        timestamp: invoice.createdAt,
        entity: {
          type: "pharmacy",
          name: pharmacyDetail?.name,
          address: pharmacyDetail?.address,
        },
        details: {
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          supplyChainCompleted: invoice.supplyChainCompleted,
        },
        proof: proof
          ? {
              receivedAt: proof.completedAt,
              receivedBy: proof.receivedBy,
              status: proof.status,
              supplyChainCompleted: proof.supplyChainCompleted,
            }
          : null,
      });
    }

    return {
      nftInfo: nft,
      batchInfo: {
        batchNumber: production.batchNumber,
        drug: production.drug,
        manufacturer: production.manufacturer,
        mfgDate: production.mfgDate,
        expDate: production.expDate,
      },
      timeline,
    };
  }
}

