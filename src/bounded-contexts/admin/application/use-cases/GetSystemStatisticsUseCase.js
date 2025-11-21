import { GetSystemStatisticsDTO } from "../dto/GetSystemStatisticsDTO.js";

import {
  PharmaCompanyModel,
  DistributorModel,
  PharmacyModel,
} from "../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js";
import { DrugInfoModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/DrugInfoSchema.js";
import { NFTInfoModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js";
import { ManufacturerInvoiceModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js";
import { CommercialInvoiceModel } from "../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js";
import { ProofOfProductionModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js";
import { ProofOfDistributionModel } from "../../../distributor/infrastructure/persistence/mongoose/schemas/ProofOfDistributionSchema.js";
import { ProofOfPharmacyModel } from "../../../pharmacy/infrastructure/persistence/mongoose/schemas/ProofOfPharmacySchema.js";

export class GetSystemStatisticsUseCase {
  constructor(
    userRepository,
    businessEntityRepository
  ) {
    this._userRepository = userRepository;
    this._businessEntityRepository = businessEntityRepository;
  }

  async execute(dto) {
    dto.validate();

    // Thống kê users
    const users = {
      total: await this._userRepository.count(),
      byRole: {
        user: await this._userRepository.countByRole("user"),
        system_admin: await this._userRepository.countByRole("system_admin"),
        pharma_company: await this._userRepository.countByRole("pharma_company"),
        distributor: await this._userRepository.countByRole("distributor"),
        pharmacy: await this._userRepository.countByRole("pharmacy"),
      },
      byStatus: {
        active: await this._userRepository.countByStatus("active"),
        inactive: await this._userRepository.countByStatus("inactive"),
        banned: await this._userRepository.countByStatus("banned"),
        pending: await this._userRepository.countByStatus("pending"),
      },
    };

    // Thống kê business entities
    const businesses = {
      pharmaCompanies: await this._businessEntityRepository.countPharmaCompanies(),
      distributors: await this._businessEntityRepository.countDistributors(),
      pharmacies: await this._businessEntityRepository.countPharmacies(),
    };

    // Thống kê drugs và NFTs - sử dụng models trực tiếp cho tạm thời
    const drugs = {
      total: await DrugInfoModel.countDocuments(),
      active: await DrugInfoModel.countDocuments({ status: "active" }),
    };

    const nfts = {
      total: await NFTInfoModel.countDocuments(),
      byStatus: {
        minted: await NFTInfoModel.countDocuments({ status: "minted" }),
        transferred: await NFTInfoModel.countDocuments({ status: "transferred" }),
        sold: await NFTInfoModel.countDocuments({ status: "sold" }),
        expired: await NFTInfoModel.countDocuments({ status: "expired" }),
        recalled: await NFTInfoModel.countDocuments({ status: "recalled" }),
      },
    };

    // Thống kê invoices
    const invoices = {
      manufacturer: await ManufacturerInvoiceModel.countDocuments(),
      commercial: await CommercialInvoiceModel.countDocuments(),
    };

    // Thống kê proofs
    const proofs = {
      production: await ProofOfProductionModel.countDocuments(),
      distribution: await ProofOfDistributionModel.countDocuments(),
      pharmacy: await ProofOfPharmacyModel.countDocuments(),
    };

    return {
      users,
      businesses,
      drugs,
      nfts,
      invoices,
      proofs,
    };
  }
}

