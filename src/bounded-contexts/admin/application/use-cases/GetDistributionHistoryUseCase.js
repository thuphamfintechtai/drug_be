import { GetDistributionHistoryDTO } from "../dto/GetDistributionHistoryDTO.js";
import { CommercialInvoiceModel } from "../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js";
import { ProofOfPharmacyModel } from "../../../pharmacy/infrastructure/persistence/mongoose/schemas/ProofOfPharmacySchema.js";

export class GetDistributionHistoryUseCase {
  async execute(dto) {
    dto.validate();

    const filter = {};

    if (dto.distributorId) {
      filter.fromDistributor = dto.distributorId;
    }

    if (dto.pharmacyId) {
      filter.toPharmacy = dto.pharmacyId;
    }

    if (dto.drugId) {
      filter.drug = dto.drugId;
    }

    if (dto.status) {
      filter.status = dto.status;
    }

    if (dto.startDate || dto.endDate) {
      filter.createdAt = {};
      if (dto.startDate) {
        filter.createdAt.$gte = dto.startDate;
      }
      if (dto.endDate) {
        filter.createdAt.$lte = dto.endDate;
      }
    }

    // Lấy lịch sử phân phối từ CommercialInvoice và ProofOfPharmacy
    const commercialInvoices = await CommercialInvoiceModel.find(filter)
      .populate("fromDistributor", "username email fullName")
      .populate("toPharmacy", "username email fullName")
      .populate("drug", "tradeName atcCode genericName")
      .populate("nftInfo")
      .sort({ createdAt: -1 })
      .skip(dto.getSkip())
      .limit(dto.limit);

    const proofs = await ProofOfPharmacyModel.find(filter)
      .populate("fromDistributor", "username email fullName")
      .populate("toPharmacy", "username email fullName")
      .populate("drug", "tradeName atcCode genericName")
      .populate("commercialInvoice")
      .sort({ createdAt: -1 })
      .skip(dto.getSkip())
      .limit(dto.limit);

    const distributionHistory = [];

    // Kết hợp CommercialInvoice và ProofOfPharmacy
    const invoiceMap = new Map();
    commercialInvoices.forEach((invoice) => {
      invoiceMap.set(invoice._id.toString(), {
        invoice,
        proof: null,
      });
    });

    proofs.forEach((proof) => {
      if (proof.commercialInvoice) {
        const invoiceId =
          proof.commercialInvoice._id || proof.commercialInvoice;
        if (invoiceMap.has(invoiceId.toString())) {
          invoiceMap.get(invoiceId.toString()).proof = proof;
        } else {
          invoiceMap.set(invoiceId.toString(), {
            invoice: null,
            proof,
          });
        }
      } else {
        distributionHistory.push({
          type: "proof_only",
          proof,
        });
      }
    });

    invoiceMap.forEach((value) => {
      distributionHistory.push({
        type: "full_record",
        invoice: value.invoice,
        proof: value.proof,
      });
    });

    // Sắp xếp theo thời gian
    distributionHistory.sort((a, b) => {
      const dateA =
        a.invoice?.createdAt || a.proof?.createdAt || new Date(0);
      const dateB =
        b.invoice?.createdAt || b.proof?.createdAt || new Date(0);
      return new Date(dateB) - new Date(dateA);
    });

    const total = await CommercialInvoiceModel.countDocuments(filter);

    return {
      distributionHistory: distributionHistory.slice(0, dto.limit),
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total,
        pages: Math.ceil(total / dto.limit),
      },
    };
  }
}

