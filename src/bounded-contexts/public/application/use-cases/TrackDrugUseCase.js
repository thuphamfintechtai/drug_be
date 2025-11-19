import { TrackDrugDTO } from "../dto/TrackDrugDTO.js";

export class TrackDrugUseCase {
  constructor(
    nftRepository,
    drugInfoRepository,
    proofOfProductionRepository,
    proofOfDistributionRepository,
    proofOfPharmacyRepository,
    manufacturerInvoiceRepository,
    commercialInvoiceRepository,
    blockchainService
  ) {
    this._nftRepository = nftRepository;
    this._drugInfoRepository = drugInfoRepository;
    this._proofOfProductionRepository = proofOfProductionRepository;
    this._proofOfDistributionRepository = proofOfDistributionRepository;
    this._proofOfPharmacyRepository = proofOfPharmacyRepository;
    this._manufacturerInvoiceRepository = manufacturerInvoiceRepository;
    this._commercialInvoiceRepository = commercialInvoiceRepository;
    this._blockchainService = blockchainService;
  }

  async execute(dto) {
    dto.validate();

    // Find NFT by tokenId
    const nft = await this._nftRepository.findByTokenId(dto.tokenId);
    if (!nft) {
      throw new Error("Không tìm thấy NFT với tokenId này");
    }

    // Get drug info
    const drug = await this._drugInfoRepository.findById(nft.drugId);
    if (!drug) {
      throw new Error("Không tìm thấy thông tin thuốc");
    }

    // Get proof of production
    let proofOfProduction = null;
    if (nft.proofOfProductionId) {
      proofOfProduction = await this._proofOfProductionRepository.findById(nft.proofOfProductionId);
    }

    // Get blockchain history
    let blockchainHistory = [];
    try {
      blockchainHistory = await this._blockchainService.getTrackingHistory(dto.tokenId);
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử blockchain:", error);
    }

    // Get supply chain history
    const supplyChainHistory = [];

    // Find manufacturer invoices
    const manufacturerInvoices = await this._manufacturerInvoiceRepository.findByDrug(nft.drugId);
    for (const invoice of manufacturerInvoices) {
      if (invoice.tokenIds && invoice.tokenIds.includes(dto.tokenId)) {
        supplyChainHistory.push({
          type: "manufacturer_to_distributor",
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          from: invoice.fromManufacturerId,
          to: invoice.toDistributorId,
          date: invoice.createdAt,
          chainTxHash: invoice.chainTxHash,
          status: invoice.status,
        });
      }
    }

    // Find proof of distribution
    const distributions = await this._proofOfDistributionRepository.findByDistributor(null, {});
    for (const dist of distributions) {
      if (dist.batchNumber === nft.batchNumber) {
        supplyChainHistory.push({
          type: "distribution",
          distributionId: dist.id,
          from: dist.fromManufacturerId,
          to: dist.toDistributorId,
          date: dist.distributionDate || dist.createdAt,
          chainTxHash: dist.chainTxHash,
          status: dist.status,
        });
      }
    }

    // Find commercial invoices
    const commercialInvoices = await this._commercialInvoiceRepository.findByPharmacy(null, {});
    for (const invoice of commercialInvoices) {
      if (invoice.tokenIds && invoice.tokenIds.includes(dto.tokenId)) {
        supplyChainHistory.push({
          type: "distributor_to_pharmacy",
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          from: invoice.fromDistributorId,
          to: invoice.toPharmacyId,
          date: invoice.createdAt,
          chainTxHash: invoice.chainTxHash,
          status: invoice.status,
        });
      }
    }

    // Find proof of pharmacy
    const pharmacyReceipts = await this._proofOfPharmacyRepository.findByPharmacy(null, {});
    for (const receipt of pharmacyReceipts) {
      if (receipt.batchNumber === nft.batchNumber) {
        supplyChainHistory.push({
          type: "pharmacy_receipt",
          receiptId: receipt.id,
          from: receipt.fromDistributorId,
          to: receipt.toPharmacyId,
          date: receipt.receiptDate || receipt.createdAt,
          chainTxHash: receipt.chainTxHash,
          status: receipt.status,
        });
      }
    }

    // Sort by date
    supplyChainHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      nft: {
        tokenId: nft.tokenId,
        serialNumber: nft.serialNumber,
        batchNumber: nft.batchNumber,
        status: nft.status,
        ownerId: nft.ownerId,
        mfgDate: nft.mfgDate,
        expDate: nft.expDate,
      },
      drug: {
        id: drug.id,
        tradeName: drug.drugName,
        genericName: drug.genericName,
        atcCode: drug.atcCode,
        dosageForm: drug.dosageForm,
        strength: drug.strength,
        packaging: drug.packaging,
      },
      production: proofOfProduction ? {
        id: proofOfProduction.id,
        batchNumber: proofOfProduction.batchNumber,
        manufacturerId: proofOfProduction.manufacturerId,
        quantity: proofOfProduction.quantity,
        mfgDate: proofOfProduction.mfgDate,
        expDate: proofOfProduction.expDate,
        chainTxHash: proofOfProduction.chainTxHash,
        status: proofOfProduction.status,
      } : null,
      supplyChainHistory,
      blockchainHistory,
    };
  }
}

