import { Container } from "./container.js";
import { connectDatabase } from "../infrastructure/database/mongoose/connection.js";
import { InMemoryEventBus } from "../shared-kernel/infrastructure/event-bus/InMemoryEventBus.js";

// Identity-Access imports
import { UserRepository } from "../bounded-contexts/identity-access/infrastructure/persistence/mongoose/UserRepository.js";
import { JwtTokenService } from "../bounded-contexts/identity-access/infrastructure/security/JwtTokenService.js";
import { PasswordHasher } from "../bounded-contexts/identity-access/infrastructure/security/PasswordHasher.js";
import { AuthenticationApplicationService } from "../bounded-contexts/identity-access/application/services/AuthenticationApplicationService.js";
import { UserManagementApplicationService } from "../bounded-contexts/identity-access/application/services/UserManagementApplicationService.js";
import { AuthController } from "../bounded-contexts/identity-access/presentation/controllers/AuthController.js";
import { UserController } from "../bounded-contexts/identity-access/presentation/controllers/UserController.js";
import { createAuthRoutes } from "../bounded-contexts/identity-access/presentation/routes/authRoutes.js";
import { createUserRoutes } from "../bounded-contexts/identity-access/presentation/routes/userRoutes.js";

// Registration imports
import { RegistrationRequestRepository } from "../bounded-contexts/registration/infrastructure/persistence/mongoose/RegistrationRequestRepository.js";
import { BusinessEntityRepository } from "../bounded-contexts/registration/infrastructure/persistence/BusinessEntityRepository.js";
import { BusinessEntityFactory } from "../bounded-contexts/registration/infrastructure/persistence/BusinessEntityFactory.js";
import { BusinessEntityService } from "../bounded-contexts/registration/application/services/BusinessEntityService.js";
import { BlockchainAdapter } from "../bounded-contexts/registration/infrastructure/blockchain/BlockchainAdapter.js";
import { RegistrationDomainService } from "../bounded-contexts/registration/domain/domain-services/RegistrationDomainService.js";
import { RegistrationApplicationService } from "../bounded-contexts/registration/application/services/RegistrationApplicationService.js";
import { RegistrationController } from "../bounded-contexts/registration/presentation/controllers/RegistrationController.js";
import { createRegistrationRoutes } from "../bounded-contexts/registration/presentation/routes/registrationRoutes.js";

// Supply-Chain imports
import { DrugInfoRepository } from "../bounded-contexts/supply-chain/infrastructure/persistence/mongoose/DrugInfoRepository.js";
import { DrugManagementApplicationService } from "../bounded-contexts/supply-chain/application/services/DrugManagementApplicationService.js";
import { DrugController } from "../bounded-contexts/supply-chain/presentation/controllers/DrugController.js";
import { createDrugRoutes } from "../bounded-contexts/supply-chain/presentation/routes/drugRoutes.js";

// Production & NFT imports
import { NFTRepository } from "../bounded-contexts/supply-chain/infrastructure/persistence/mongoose/NFTRepository.js";
import { ProofOfProductionRepository } from "../bounded-contexts/supply-chain/infrastructure/persistence/mongoose/ProofOfProductionRepository.js";
import { ManufacturerInvoiceRepository } from "../bounded-contexts/supply-chain/infrastructure/persistence/mongoose/ManufacturerInvoiceRepository.js";
import { ProductionApplicationService } from "../bounded-contexts/supply-chain/application/services/ProductionApplicationService.js";
import { IPFSService } from "../bounded-contexts/supply-chain/infrastructure/external/ipfs/IPFSService.js";
import { ProductionController } from "../bounded-contexts/supply-chain/presentation/controllers/ProductionController.js";
import { createProductionRoutes } from "../bounded-contexts/supply-chain/presentation/routes/productionRoutes.js";

// Distributor imports
import { CommercialInvoiceRepository } from "../bounded-contexts/distributor/infrastructure/persistence/mongoose/CommercialInvoiceRepository.js";
import { ProofOfDistributionRepository } from "../bounded-contexts/distributor/infrastructure/persistence/mongoose/ProofOfDistributionRepository.js";
import { DistributorApplicationService } from "../bounded-contexts/distributor/application/services/DistributorApplicationService.js";
import { DistributorController } from "../bounded-contexts/distributor/presentation/controllers/DistributorController.js";
import { createDistributorRoutes } from "../bounded-contexts/distributor/presentation/routes/distributorRoutes.js";

// Pharmacy imports
import { ProofOfPharmacyRepository } from "../bounded-contexts/pharmacy/infrastructure/persistence/mongoose/ProofOfPharmacyRepository.js";
import { PharmacyApplicationService } from "../bounded-contexts/pharmacy/application/services/PharmacyApplicationService.js";
import { PharmacyController } from "../bounded-contexts/pharmacy/presentation/controllers/PharmacyController.js";
import { createPharmacyRoutes } from "../bounded-contexts/pharmacy/presentation/routes/pharmacyRoutes.js";

// Public imports
import { BlockchainService as PublicBlockchainService } from "../bounded-contexts/public/infrastructure/blockchain/BlockchainService.js";
import { PublicTrackingApplicationService } from "../bounded-contexts/public/application/services/PublicTrackingApplicationService.js";
import { PublicController } from "../bounded-contexts/public/presentation/controllers/PublicController.js";
import { createPublicRoutes } from "../bounded-contexts/public/presentation/routes/publicRoutes.js";

// Admin imports
import { AdminBlockchainService } from "../bounded-contexts/admin/infrastructure/blockchain/AdminBlockchainService.js";
import { AdminApplicationService } from "../bounded-contexts/admin/application/services/AdminApplicationService.js";
import { AdminController } from "../bounded-contexts/admin/presentation/controllers/AdminController.js";
import { createAdminRoutes } from "../bounded-contexts/admin/presentation/routes/adminRoutes.js";

// Statistics imports
import { StatisticsRepository } from "../bounded-contexts/statistics/infrastructure/persistence/StatisticsRepository.js";
import { StatisticsApplicationService } from "../bounded-contexts/statistics/application/services/StatisticsApplicationService.js";
import { StatisticsController } from "../bounded-contexts/statistics/presentation/controllers/StatisticsController.js";
import { createStatisticsRoutes } from "../bounded-contexts/statistics/presentation/routes/statisticsRoutes.js";

import { appConfig } from "../infrastructure/config/app.config.js";

export class ApplicationBootstrap {
  constructor() {
    this.container = new Container();
    this.eventBus = new InMemoryEventBus();
  }

  async initialize() {
    // Connect to database
    await connectDatabase();

    // Initialize middleware with dependencies
    await this.initializeMiddleware();

    // Register infrastructure services
    this.container.register("eventBus", () => this.eventBus, true);
    this.container.register("userRepository", () => new UserRepository(), true);
    this.container.register("jwtService", () => new JwtTokenService(appConfig.jwtSecret, appConfig.jwtExpiresIn), true);
    this.container.register("passwordHasher", () => new PasswordHasher(), true);

    // Registration infrastructure
    this.container.register("registrationRequestRepository", () => new RegistrationRequestRepository(), true);
    this.container.register("businessEntityRepository", () => new BusinessEntityRepository(), true);
    this.container.register("businessEntityFactory", () => new BusinessEntityFactory(), true);
    this.container.register(
      "businessEntityService",
      (c) =>
        new BusinessEntityService(
          c.resolve("businessEntityRepository"),
          c.resolve("businessEntityFactory")
        ),
      true
    );
    this.container.register("blockchainAdapter", () => new BlockchainAdapter(), true);
    this.container.register(
      "registrationDomainService",
      (c) =>
        new RegistrationDomainService(
          c.resolve("registrationRequestRepository"),
          c.resolve("businessEntityRepository")
        ),
      true
    );

    // Supply-Chain infrastructure
    this.container.register("drugInfoRepository", () => new DrugInfoRepository(), true);
    this.container.register("nftRepository", () => new NFTRepository(), true);
    this.container.register("proofOfProductionRepository", () => new ProofOfProductionRepository(), true);
    this.container.register("manufacturerInvoiceRepository", () => new ManufacturerInvoiceRepository(), true);
    this.container.register("ipfsService", () => new IPFSService(), true);

    // Distributor infrastructure
    this.container.register("commercialInvoiceRepository", () => new CommercialInvoiceRepository(), true);
    this.container.register("proofOfDistributionRepository", () => new ProofOfDistributionRepository(), true);

    // Pharmacy infrastructure
    this.container.register("proofOfPharmacyRepository", () => new ProofOfPharmacyRepository(), true);

    // Inject drugInfoRepository into PharmacyApplicationService for getDrugs/searchDrugByATCCode

    // Public infrastructure
    this.container.register("publicBlockchainService", () => new PublicBlockchainService(), true);

    // Admin infrastructure
    this.container.register("adminBlockchainService", () => new AdminBlockchainService(), true);

    // Statistics infrastructure
    this.container.register("statisticsRepository", () => new StatisticsRepository(), true);

    // Register application services
    this.container.register(
      "authenticationService",
      (c) =>
        new AuthenticationApplicationService(
          c.resolve("userRepository"),
          c.resolve("passwordHasher"),
          c.resolve("jwtService"),
          c.resolve("eventBus"),
          c.resolve("businessEntityService"), // businessEntityService
          null  // passwordResetRepository - to be implemented
        ),
      true
    );

    this.container.register(
      "userManagementService",
      (c) =>
        new UserManagementApplicationService(
          c.resolve("userRepository"),
          c.resolve("businessEntityService")
        ),
      true
    );

    // Registration application services
    this.container.register(
      "registrationService",
      (c) =>
        new RegistrationApplicationService(
          c.resolve("userRepository"),
          c.resolve("registrationRequestRepository"),
          c.resolve("businessEntityRepository"),
          c.resolve("passwordHasher"),
          c.resolve("businessEntityFactory"),
          c.resolve("blockchainAdapter"),
          c.resolve("registrationDomainService"),
          c.resolve("eventBus")
        ),
      true
    );

    // Supply-Chain application services
    this.container.register(
      "drugManagementService",
      (c) =>
        new DrugManagementApplicationService(
          c.resolve("drugInfoRepository"),
          c.resolve("eventBus")
        ),
      true
    );

    this.container.register(
      "productionService",
      (c) =>
        new ProductionApplicationService(
          c.resolve("drugInfoRepository"),
          c.resolve("nftRepository"),
          c.resolve("proofOfProductionRepository"),
          c.resolve("manufacturerInvoiceRepository"),
          c.resolve("ipfsService"),
          c.resolve("eventBus")
        ),
      true
    );

    // Distributor application services
    this.container.register(
      "distributorService",
      (c) =>
        new DistributorApplicationService(
          c.resolve("manufacturerInvoiceRepository"),
          c.resolve("commercialInvoiceRepository"),
          c.resolve("proofOfDistributionRepository"),
          c.resolve("nftRepository"),
          c.resolve("proofOfProductionRepository"),
          c.resolve("drugInfoRepository"),
          c.resolve("eventBus")
        ),
      true
    );

    // Pharmacy application services
    this.container.register(
      "pharmacyService",
      (c) =>
        new PharmacyApplicationService(
          c.resolve("commercialInvoiceRepository"),
          c.resolve("proofOfPharmacyRepository"),
          c.resolve("nftRepository"),
          c.resolve("eventBus"),
          c.resolve("drugInfoRepository") // Inject for getDrugs/searchDrugByATCCode
        ),
      true
    );

    // Public application services
    this.container.register(
      "publicTrackingService",
      (c) =>
        new PublicTrackingApplicationService(
          c.resolve("nftRepository"),
          c.resolve("drugInfoRepository"),
          c.resolve("proofOfProductionRepository"),
          c.resolve("proofOfDistributionRepository"),
          c.resolve("proofOfPharmacyRepository"),
          c.resolve("manufacturerInvoiceRepository"),
          c.resolve("commercialInvoiceRepository"),
          c.resolve("publicBlockchainService")
        ),
      true
    );

    // Admin application services
    this.container.register(
      "adminService",
      (c) =>
        new AdminApplicationService(
          c.resolve("registrationRequestRepository"),
          c.resolve("userRepository"),
          c.resolve("businessEntityRepository"),
          c.resolve("drugInfoRepository"),
          c.resolve("adminBlockchainService"),
          c.resolve("eventBus")
        ),
      true
    );

    // Statistics application services
    this.container.register(
      "statisticsService",
      (c) =>
        new StatisticsApplicationService(
          c.resolve("statisticsRepository")
        ),
      true
    );

    // Register controllers
    this.container.register(
      "authController",
      (c) =>
        new AuthController(
          c.resolve("authenticationService"),
          c.resolve("userManagementService"),
          null // passwordResetService - to be implemented
        ),
      true
    );

    this.container.register(
      "userController",
      (c) => new UserController(c.resolve("userManagementService")),
      true
    );

    this.container.register(
      "registrationController",
      (c) => new RegistrationController(c.resolve("registrationService")),
      true
    );

    this.container.register(
      "drugController",
      (c) => new DrugController(c.resolve("drugManagementService")),
      true
    );

    this.container.register(
      "productionController",
      (c) =>
        new ProductionController(
          c.resolve("productionService"),
          c.resolve("nftRepository"),
          c.resolve("manufacturerInvoiceRepository")
        ),
      true
    );

    this.container.register(
      "distributorController",
      (c) => new DistributorController(c.resolve("distributorService")),
      true
    );

    this.container.register(
      "pharmacyController",
      (c) => new PharmacyController(c.resolve("pharmacyService")),
      true
    );

    this.container.register(
      "publicController",
      (c) => new PublicController(c.resolve("publicTrackingService")),
      true
    );

    this.container.register(
      "adminController",
      (c) => new AdminController(c.resolve("adminService")),
      true
    );

    this.container.register(
      "statisticsController",
      (c) => new StatisticsController(c.resolve("statisticsService")),
      true
    );

    // Register routes
    this.container.register(
      "authRoutes",
      (c) => createAuthRoutes(c.resolve("authController")),
      true
    );

    this.container.register(
      "userRoutes",
      (c) => createUserRoutes(c.resolve("userController")),
      true
    );

    this.container.register(
      "registrationRoutes",
      (c) => createRegistrationRoutes(c.resolve("registrationController")),
      true
    );

    this.container.register(
      "drugRoutes",
      (c) => createDrugRoutes(c.resolve("drugController")),
      true
    );

    this.container.register(
      "productionRoutes",
      (c) => createProductionRoutes(c.resolve("productionController")),
      true
    );

    this.container.register(
      "distributorRoutes",
      (c) => createDistributorRoutes(c.resolve("distributorController")),
      true
    );

    this.container.register(
      "pharmacyRoutes",
      (c) => createPharmacyRoutes(c.resolve("pharmacyController")),
      true
    );

    this.container.register(
      "publicRoutes",
      (c) => createPublicRoutes(c.resolve("publicController")),
      true
    );

    this.container.register(
      "adminRoutes",
      (c) => createAdminRoutes(c.resolve("adminController")),
      true
    );

    this.container.register(
      "statisticsRoutes",
      (c) => createStatisticsRoutes(c.resolve("statisticsController")),
      true
    );

    return this.container;
  }

  /**
   * Initialize shared middleware with dependencies
   */
  async initializeMiddleware() {
    // Dynamic import for ES modules
    const { initializeAuthMiddleware } = await import("../bounded-contexts/identity-access/presentation/middleware/authMiddleware.js");
    initializeAuthMiddleware(
      this.container.resolve("userRepository"),
      this.container.resolve("jwtService")
    );
  }

  getRoutes() {
    return {
      "/api/auth": this.container.resolve("authRoutes"),
      "/api/users": this.container.resolve("userRoutes"),
      "/api/registration": this.container.resolve("registrationRoutes"),
      "/api/drugs": this.container.resolve("drugRoutes"),
      "/api/production": this.container.resolve("productionRoutes"),
      "/api/distributor": this.container.resolve("distributorRoutes"),
      "/api/pharmacy": this.container.resolve("pharmacyRoutes"),
      "/api/public": this.container.resolve("publicRoutes"),
      "/api/admin": this.container.resolve("adminRoutes"),
      "/api/statistics": this.container.resolve("statisticsRoutes"),
      // Add more routes here as bounded contexts are completed
    };
  }
}

