import { TrackDrugUseCase } from "../use-cases/TrackDrugUseCase.js";
import { TrackDrugDTO } from "../dto/TrackDrugDTO.js";

export class PublicTrackingApplicationService {
  constructor(
    nftRepository,
    drugInfoRepository,
    proofOfProductionRepository,
    proofOfDistributionRepository,
    proofOfPharmacyRepository,
    manufacturerInvoiceRepository,
    commercialInvoiceRepository,
    blockchainService,
    userRepository = null
  ) {
    this._nftRepository = nftRepository;
    this._drugInfoRepository = drugInfoRepository;
    this._proofOfProductionRepository = proofOfProductionRepository;
    this._proofOfDistributionRepository = proofOfDistributionRepository;
    this._proofOfPharmacyRepository = proofOfPharmacyRepository;
    this._manufacturerInvoiceRepository = manufacturerInvoiceRepository;
    this._commercialInvoiceRepository = commercialInvoiceRepository;
    this._blockchainService = blockchainService;
    this._userRepository = userRepository;

    this._trackDrugUseCase = new TrackDrugUseCase(
      nftRepository,
      drugInfoRepository,
      proofOfProductionRepository,
      proofOfDistributionRepository,
      proofOfPharmacyRepository,
      manufacturerInvoiceRepository,
      commercialInvoiceRepository,
      blockchainService,
      userRepository
    );
  }

  async trackDrugByTokenId(tokenId) {
    const dto = new TrackDrugDTO(tokenId);
    return await this._trackDrugUseCase.execute(dto);
  }
}

