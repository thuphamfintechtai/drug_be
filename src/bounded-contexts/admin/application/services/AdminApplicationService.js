import { GetRegistrationStatisticsUseCase } from "../use-cases/GetRegistrationStatisticsUseCase.js";
import { RetryBlockchainRegistrationUseCase } from "../use-cases/RetryBlockchainRegistrationUseCase.js";
import { GetSystemStatisticsUseCase } from "../use-cases/GetSystemStatisticsUseCase.js";
import { GetAllDrugsUseCase } from "../use-cases/GetAllDrugsUseCase.js";
import { GetDrugDetailsUseCase } from "../use-cases/GetDrugDetailsUseCase.js";
import { GetDrugStatisticsUseCase } from "../use-cases/GetDrugStatisticsUseCase.js";
import { GetSupplyChainHistoryUseCase } from "../use-cases/GetSupplyChainHistoryUseCase.js";
import { GetDistributionHistoryUseCase } from "../use-cases/GetDistributionHistoryUseCase.js";
import { GetBatchListUseCase } from "../use-cases/GetBatchListUseCase.js";
import { GetBatchJourneyUseCase } from "../use-cases/GetBatchJourneyUseCase.js";
import { GetNFTJourneyUseCase } from "../use-cases/GetNFTJourneyUseCase.js";
import { GetRegistrationStatisticsDTO } from "../dto/GetRegistrationStatisticsDTO.js";
import { RetryBlockchainRegistrationDTO } from "../dto/RetryBlockchainRegistrationDTO.js";
import { GetSystemStatisticsDTO } from "../dto/GetSystemStatisticsDTO.js";
import { GetAllDrugsDTO } from "../dto/GetAllDrugsDTO.js";
import { GetDrugDetailsDTO } from "../dto/GetDrugDetailsDTO.js";
import { GetSupplyChainHistoryDTO } from "../dto/GetSupplyChainHistoryDTO.js";
import { GetDistributionHistoryDTO } from "../dto/GetDistributionHistoryDTO.js";
import { GetBatchListDTO } from "../dto/GetBatchListDTO.js";
import { GetBatchJourneyDTO } from "../dto/GetBatchJourneyDTO.js";
import { GetNFTJourneyDTO } from "../dto/GetNFTJourneyDTO.js";

export class AdminApplicationService {
  constructor(
    registrationRequestRepository,
    userRepository,
    businessEntityRepository,
    drugInfoRepository,
    blockchainService,
    eventBus
  ) {
    this._registrationRequestRepository = registrationRequestRepository;
    this._userRepository = userRepository;
    this._businessEntityRepository = businessEntityRepository;
    this._drugInfoRepository = drugInfoRepository;
    this._blockchainService = blockchainService;
    this._eventBus = eventBus;

    this._getRegistrationStatisticsUseCase = new GetRegistrationStatisticsUseCase(
      registrationRequestRepository
    );

    this._retryBlockchainRegistrationUseCase = new RetryBlockchainRegistrationUseCase(
      registrationRequestRepository,
      userRepository,
      blockchainService,
      eventBus
    );

    this._getSystemStatisticsUseCase = new GetSystemStatisticsUseCase(
      userRepository,
      businessEntityRepository
    );

    this._getAllDrugsUseCase = new GetAllDrugsUseCase(drugInfoRepository);
    this._getDrugDetailsUseCase = new GetDrugDetailsUseCase(drugInfoRepository);
    this._getDrugStatisticsUseCase = new GetDrugStatisticsUseCase();
    this._getSupplyChainHistoryUseCase = new GetSupplyChainHistoryUseCase();
    this._getDistributionHistoryUseCase = new GetDistributionHistoryUseCase();
    this._getBatchListUseCase = new GetBatchListUseCase();
    this._getBatchJourneyUseCase = new GetBatchJourneyUseCase();
    this._getNFTJourneyUseCase = new GetNFTJourneyUseCase();
  }

  async getRegistrationStatistics(dto) {
    return await this._getRegistrationStatisticsUseCase.execute(dto);
  }

  async retryBlockchainRegistration(dto, adminId) {
    return await this._retryBlockchainRegistrationUseCase.execute(dto, adminId);
  }

  async getSystemStatistics(dto) {
    return await this._getSystemStatisticsUseCase.execute(dto);
  }

  async getAllDrugs(dto) {
    return await this._getAllDrugsUseCase.execute(dto);
  }

  async getDrugDetails(dto) {
    return await this._getDrugDetailsUseCase.execute(dto);
  }

  async getDrugStatistics() {
    return await this._getDrugStatisticsUseCase.execute();
  }

  async getSupplyChainHistory(dto) {
    return await this._getSupplyChainHistoryUseCase.execute(dto);
  }

  async getDistributionHistory(dto) {
    return await this._getDistributionHistoryUseCase.execute(dto);
  }

  async getBatchList(dto) {
    return await this._getBatchListUseCase.execute(dto);
  }

  async getBatchJourney(dto) {
    return await this._getBatchJourneyUseCase.execute(dto);
  }

  async getNFTJourney(dto) {
    return await this._getNFTJourneyUseCase.execute(dto);
  }
}

