# Hướng dẫn kiến trúc cho thư mục `src/`

Tài liệu này giúp developer mới hiểu tổng quan kiến trúc, vai trò từng thư mục và cách tiếp tục phát triển các bounded context theo đúng chuẩn DDD/Clean Architecture.

## 1. Tổng quan cấu trúc

```
src/
├── bounded-contexts/        # Tách domain theo nghiệp vụ
├── shared-kernel/           # Thành phần dùng chung (Entity, Event, UnitOfWork)
├── infrastructure/          # Cấu hình cross-cutting (database, blockchain, config)
├── presentation/            # Lớp HTTP chung (Express app, middleware, responses)
└── composition-root/        # DI container và bootstrap hệ thống
```

Luồng phụ thuộc luôn đi từ Presentation → Application → Domain. Infrastructure chỉ implement các interface được định nghĩa trong Domain/Application và được inject thông qua composition root.

## 2. Composition Root

### 2.1 `composition-root/container.js`
- Đây là **trái tim DI** của toàn project. Mỗi service/ repository/ controller phải được `register`.
- API chi tiết:
  - `register(name, factory, singleton = false)`: lưu lại factory function cùng flag singleton. Ví dụ `container.register("userRepository", () => new UserRepository(), true)`.
  - `resolve(name)`: tạo mới (hoặc lấy cache với singleton) và trả về instance. Nếu thiếu đăng ký → throw error ngay.
  - `has(name)`: check service đã được đăng ký chưa (dùng trong bootstrap khi cần).
- Factory luôn nhận `container` để tự resolve dependency khác: `new DrugManagementApplicationService(c.resolve("drugInfoRepository"), ...)`.

### 2.2 `composition-root/bootstrap.js`
- Trình tự khởi động chi tiết:
  1. Gọi `connectDatabase` để thiết lập MongoDB connection một lần.
  2. Đăng ký các service chung: event bus, user repository, JWT service, password hasher, v.v.
  3. `initializeMiddleware()` inject các middleware cần DI (ví dụ auth middleware cần userRepository).
  4. Cho từng bounded context:
     - Đăng ký repository (mapping interface → implementation).
     - Đăng ký application service/use case.
     - Đăng ký controller với dependencies đã resolve.
     - Đăng ký route factory (`createDrugRoutes`, `createRegistrationRoutes`...) để nhận controller và mount vào Express `app`.
  5. Trả về object gồm `app`, `container`, `eventBus` để `src/index.js` sử dụng.
- Đây cũng là nơi setup các external services (BlockchainAdapter, IPFSService). Nếu quên đăng ký → DI không resolve được và server crash.

## 3. Shared Kernel

### 3.1 `shared-kernel/domain/`
- `Entity`: base class có `id` và method `equals`. Tất cả entity/domain aggregate nên extend class này.
- `AggregateRoot`: mở rộng `Entity`, quản lý `_domainEvents`, cung cấp `raiseDomainEvent()` và `clearDomainEvents()`.
- `ValueObject`: cung cấp `equals()` và `valueEquals()`. Các value object (`Email`, `Role`, `DrugName`, …) extend và override `valueEquals`.
- `DomainEvent`: base class cho event, tự sinh `eventId` và `occurredOn`.

### 3.2 `shared-kernel/application/UnitOfWork.js`
- Cho phép register aggregate với trạng thái `new/dirty/removed` và commit/rollback.
- Dù chưa sử dụng rộng rãi, khi cần bảo đảm consistency giữa nhiều repository, hãy wrap logic trong unit of work này.

### 3.3 `shared-kernel/infrastructure/event-bus/`
- `IEventBus.js`: định nghĩa interface với hai hàm `publish(event)` và `subscribe(eventType, handler)`. Các bounded context chỉ biết đến interface này.
- `InMemoryEventBus.js`: implement đơn giản cho dev environment:
  - `_handlers: Map<string, handler[]>`.
  - `publish` lấy danh sách handler theo `event.constructor.name` và chạy lần lượt (await handler để hỗ trợ async).
  - Có `try/catch` quanh từng handler để không chặn các handler còn lại.
- Nếu cần RabbitMQ/Kafka, chỉ cần tạo class mới implement interface và thay registration trong bootstrap.

## 4. Bounded Contexts

Mỗi bounded context có cấu trúc tiêu chuẩn:

```
bounded-contexts/<context-name>/
├── domain/            # Aggregates, Entities, Value Objects, Domain Services, Domain Events, Repository Interfaces
├── application/       # DTOs, Use Cases, Application Services
├── infrastructure/    # Persistence (Mongoose schemas, repositories, mappers), external services
└── presentation/      # Controllers, Routes, Middleware (nếu có)
```

### 4.1 Identity-Access

| Layer | Thành phần chính | Vai trò cụ thể |
|-------|------------------|----------------|
| Domain | `aggregates/User.js`, `aggregates/Session.js`, value objects (`Email`, `Password`, `Role`), domain events (`UserRegistered`, `UserLoggedIn`), domain service `AuthenticationDomainService` | `User` chịu trách nhiệm validate username/email, hash password (thông qua service). Domain events giúp các context khác (VD: registration) biết khi user mới tạo. |
| Application | DTO (`LoginDTO`, `RegisterUserDTO`, `UserResponseDTO`), use cases (`LoginUserUseCase`, `RegisterUserUseCase`, `ResetPasswordUseCase`), services (`AuthenticationApplicationService`, `PasswordResetApplicationService`, `UserManagementApplicationService`) | `LoginUserUseCase.execute` nhận DTO, check user, verify password (thông qua `PasswordHasher`), phát event `UserLoggedIn`. |
| Infrastructure | Persistence: `UserRepository` (implements `IUserRepository`), `PasswordResetRepository`, `UserMapper`, `schemas/UserSchema.js`; Security: `JwtTokenService` (generate/verify token), `PasswordHasher` (bcrypt). | `UserRepository` chỉ thao tác với Mongo, convert sang domain object. Không chứa logic validate. |
| Presentation | `AuthController`, `UserController`, routes `authRoutes.js`, `userRoutes.js`, middleware `authMiddleware.js` (verify JWT và gắn user vào request). | Ví dụ `AuthController.login` nhận `req.body`, tạo `LoginDTO`, gọi `authenticationService.login`. |

**Luồng request mẫu**  
`POST /api/auth/register` (body username/email/password/role) → `AuthController.register` → `AuthenticationApplicationService.registerUser()` → `RegisterUserUseCase.execute()` → `UserRepository.save()` → `user.raiseDomainEvent(new UserRegistered(...))` → `eventBus.publish`.

### 4.2 Registration

| Layer | Thành phần | Vai trò |
|-------|-----------|--------|
| Domain | `RegistrationRequest` aggregate (chứa toàn bộ thông tin đăng ký), entity `CompanyInfo`, value objects (`LicenseNumber`, `TaxCode`, `WalletAddress`), domain events (`RegistrationRequestSubmitted`, `RegistrationRequestApproved`), domain service `RegistrationDomainService` | Domain service đảm bảo một taxCode/ licenseNo không bị trùng, quyết định status (pending/approved/rejected). |
| Application | DTO `SubmitRegistrationDTO`, `ApproveRegistrationDTO`; use cases `SubmitRegistrationUseCase` (tạo hồ sơ), `ApproveRegistrationUseCase` (phê duyệt + tạo doanh nghiệp + blockchain), `RejectRegistrationUseCase`; `RegistrationApplicationService` đóng vai trò facade cho controller. | `ApproveRegistrationUseCase` sử dụng `BusinessEntityFactory` để tạo real entity trong Mongo và `BlockchainAdapter` để đăng ký on-chain. |
| Infrastructure | Repositories: `RegistrationRequestRepository` (implements `IRegistrationRequestRepository`), `BusinessEntityRepository`, `BusinessEntityFactory` (tạo `PharmaCompanyModel`, `DistributorModel`, `PharmacyModel`). Blockchain: `BlockchainAdapter` wrap ethers.js AccessControl contract. Schemas: `RegistrationRequestSchema.js`, `BusinessEntitySchemas.js`. | `BusinessEntityFactory` nhận user + role + companyInfo, tạo document tương ứng và lưu. |
| Presentation | `RegistrationController`, routes `/api/registration/*`. Có các endpoint `POST /request`, `POST /approve/:id`, `POST /reject/:id`, `GET /requests`. | Sử dụng `authMiddleware` và role guard (ví dụ admin phê duyệt). |

**Luồng phê duyệt**  
Admin gọi `POST /api/registration/approve/:id` → `RegistrationController.approveRegistration` → `RegistrationApplicationService.approveRegistration` → `ApproveRegistrationUseCase.execute` → gọi `RegistrationDomainService` kiểm tra license, sau đó `BusinessEntityFactory.createBusinessEntity` + `BlockchainAdapter.registerBusinessEntity`.

### 4.3 Supply-Chain

| Layer | Thành phần | Vai trò |
|-------|-----------|--------|
| Domain | Aggregates: `DrugInfo` (thông tin thuốc), `ManufacturerInvoice`, `ProofOfProduction`, `NFT`; domain events `DrugManufactured`, `NFTMinted`, `ManufacturerToDistributorTransfer`; value objects `DrugName`, `ATCCode`, `BatchNumber`, `TokenId`, `IPFSHash`; exceptions `DrugNotFoundException`, `InsufficientQuantityException` | Domain đảm bảo rule: manufacturer chỉ xóa thuốc khi không còn NFT nào, invoice có quantity hợp lệ, NFT phải gắn với proof of production. |
| Application | DTOs `CreateDrugDTO`, `UpdateDrugDTO`, `UploadIPFSDTO`, `MintNFTDTO`; use cases `CreateDrugUseCase` (khởi tạo thuốc), `UpdateDrugUseCase`, `UploadIPFSUseCase`, `MintNFTUseCase`, `TransferToDistributorUseCase`; services `DrugManagementApplicationService` (CRUD + kiểm tra NFT trước khi xóa), `ProductionApplicationService` (quy trình IPFS → NFT → invoice). | `DrugManagementApplicationService.deleteDrug` kiểm tra `_nftRepository.findByDrug` để ngăn xóa khi đang có NFT. |
| Infrastructure | Persistence: Mongoose schemas (`DrugInfoSchema`, `ManufacturerInvoiceSchema`, `NFTInfoSchema`, `ProofOfProductionSchema`), repositories tương ứng, mappers. External: `infrastructure/external/ipfs/IPFSService.js` upload file, `infrastructure/blockchain/ethers/NFTContractService.js` gọi smart contract, event listener `BlockchainEventListener.js` nhận event on-chain và sync database. | `NFTContractService` cung cấp `uploadMetadata`, `mintNFT`, `transferToDistributor`, `getTrackingHistory`. Listener lắng nghe `Transfer` event để cập nhật ownership. |
| Presentation | `DrugController` (quản lý thuốc), `ProductionController` (IPFS + NFT), routes `/api/drugs`, `/api/production`. | Ví dụ `POST /api/production/ipfs` gọi `UploadIPFSUseCase` và trả URL IPFS + status. |

### 4.4 Distributor

- **Domain**: `CommercialInvoice`, `ProofOfDistribution`, event `DistributorToPharmacyTransfer`.
- **Infrastructure**:
  - Schemas: `infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js`, `ProofOfDistributionSchema.js`.
  - Repositories: `CommercialInvoiceRepository.js`, `ProofOfDistributionRepository.js`.
  - Mappers trong `infrastructure/persistence/mongoose/mappers/`.
- **Application**: DTO `TransferToPharmacyDTO`, `ConfirmReceiptDTO`, use cases `TransferToPharmacyUseCase`, `ConfirmReceiptUseCase`, service `DistributorApplicationService` (nhận event bus để raise transfer events).
- **Presentation**: `DistributorController`, routes `/api/distributor/*`.

### 4.5 Pharmacy

- **Domain**: Aggregate `ProofOfPharmacy` mô tả quá trình nhận thuốc tại nhà thuốc, event `DrugDelivered`.
- **Infrastructure**: Schema `ProofOfPharmacySchema.js`, mapper và repository `ProofOfPharmacyRepository.js`.
- **Application**: DTO `ConfirmReceiptDTO`, use case `ConfirmReceiptUseCase`, service `PharmacyApplicationService` để ghi nhận và phát domain event.
- **Presentation**: `PharmacyController`, routes `/api/pharmacy/*`.

### 4.6 Public

- Không định nghĩa domain riêng, tái sử dụng supply-chain domain.
- **Application**: `TrackDrugUseCase` nhận `tokenId`, gọi `NFTContractService.getTrackingHistory`, service `PublicTrackingApplicationService` làm facade.
- **Infrastructure**: `public/infrastructure/blockchain/BlockchainService.js` chứa instance của `NFTContractService`. Khi cần custom provider cho public API (chỉ read, không ký giao dịch), config tại đây.
- **Presentation**: `PublicController.getTrackingHistory` + route `/api/public/track/:tokenId`.

### 4.7 Admin

- **Application**: `AdminApplicationService` chứa các use case:
  - `GetSystemStatisticsUseCase`: tổng hợp số lượng user, registration, batch, NFT.
  - `GetBatchJourneyUseCase`, `GetNFTJourneyUseCase`: trace lịch sử batch/token.
  - `RetryBlockchainRegistrationUseCase`: retry gọi blockchain cho đăng ký bị fail.
  - Các use case khác (`GetDistributionHistory`, `GetDrugDetails`, `GetRegistrationStatistics`...).
- **Infrastructure**: `AdminBlockchainService` wrap `NFTContractService`/AccessControl contract để đọc dữ liệu blockchain riêng cho admin dashboards.
- **Presentation**: `AdminController` expose endpoints `/api/admin/system-statistics`, `/api/admin/nft/:tokenId/journey`, ... Tất cả yêu cầu auth + role admin.

### 4.8 Statistics

- **Domain**: `IStatisticsRepository` định nghĩa các method `getDashboardStats`, `getDrugStatsByStatus`, `getNFTStats`, `getDistributionStats`.
- **Infrastructure**: File `StatisticsRepository.js` hiện chỉ trả object rỗng (placeholder). Khi triển khai thực tế:
  - Inject `DrugInfoRepository`, `NFTRepository`, `CommercialInvoiceRepository`, `RegistrationRequestRepository` để tổng hợp dữ liệu.
  - Có thể sử dụng aggregation pipeline của Mongo hoặc query builder custom.
- **Application**: `StatisticsApplicationService` gọi repository, xử lý filter (date range, role).
- **Presentation**: `StatisticsController` routes `/api/statistics/dashboard`, `/api/statistics/drugs`, v.v.

## 5. Infrastructure chung (chi tiết file)

| Đường dẫn | Nhiệm vụ |
|-----------|----------|
| `infrastructure/database/mongoose/connection.js` | Dùng mongoose để connect MongoDB. Cài đặt option `autoIndex`, log connected/disconnected, bắt sự kiện lỗi để process exit khi cần. |
| `infrastructure/config/app.config.js` | Export object `appConfig` chứa `port`, `jwtSecret`, `jwtExpiresIn`, `mongoUri`, `ipfsApi`, `blockchainRpc`, v.v. Mọi nơi cần config đều import từ đây (không đọc trực tiếp `.env`). |
| `infrastructure/config/blockchain.config.js` | Hàm `loadDeployedAddresses` đọc file JSON địa chỉ contract, `loadAccessControlABI` đọc ABI AccessControl, `blockchainConfig` chứa RPC URL, private key. Được dùng bởi `BlockchainAdapter`, `NFTContractService`, `AdminBlockchainService`. |
| `DeployModule#MyNFT.json`, `deployed_addresses.json` | Các file JSON do quá trình deploy smart contract tạo ra. Không sửa thủ công; khi contract cập nhật cần replace file và commit. |

## 6. Presentation chung

- `presentation/app.js`
  - Import Express, cors.
  - Tạo `const app = express();`
  - `app.use(express.json())`, `app.use(cors())`.
  - Chưa mount routes ở đây vì bootstrap sẽ nhận `app` và mount sau.
  - Export `app` để `src/index.js` gọi.
- `presentation/http/middlewares/error.middleware.js`
  - Function `(err, req, res, next)`:
    - log lỗi.
    - Chuyển thành `ErrorResponse` (status, message, details).
    - `res.status(status).json(errorResponse.toJSON())`.
  - Luôn đặt sau cùng của middleware chain.
- `presentation/http/responses/ApiResponse.js`
  - Class có constructor `(data, meta = null)` → `toJSON()` trả `{ success: true, data, meta }`.
- `presentation/http/responses/ErrorResponse.js`
  - Constructor `(message, statusCode = 500, details = null)` → `toJSON()` trả `{ success: false, message, statusCode, details }`.

## 7. Hướng dẫn phát triển chi tiết (workflow)

1. **Tạo feature mới**
   - Xác định bounded context phù hợp.
   - Thêm/điều chỉnh domain model (aggregate, entity, value object, domain event).
   - Viết repository interface nếu cần.
   - Implement use case và DTO trong layer application.
   - Implement repository/service trong infrastructure và controller/route trong presentation.
   - Đăng ký dependency trong `composition-root/bootstrap.js`.

2. **Domain Events**
   - Aggregate sử dụng `raiseDomainEvent()` để phát sự kiện.
   - Application service chịu trách nhiệm publish từng event thông qua `eventBus`.
   - Nếu cần xử lý bất đồng bộ, tạo subscriber bằng `eventBus.subscribe(eventName, handler)`.

3. **Persistence**
   - Schemas nằm trong `infrastructure/persistence/mongoose/schemas`.
   - Luôn sử dụng `mongoose.models.ModelName || mongoose.model("ModelName", schema)` để tránh `OverwriteModelError`.
   - Mapper chuyển đổi giữa schema document và domain aggregate.

4. **Coding style**
   - Domain layer không import từ application/infrastructure.
   - Infrastructure không chứa business rule; chỉ mapping, gọi external service.
   - Application service không tạo kết nối DB trực tiếp, luôn đi qua repository interface.
   - Controller không viết rule; validate request và gọi service.

5. **Chạy ứng dụng**
   - Chuẩn bị `.env` với các biến: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `IPFS_API_URL`, `BLOCKCHAIN_RPC`, `PRIVATE_KEY` (nếu cần ký giao dịch), v.v.
   - Cài đặt: `npm install`.
   - Dev mode: `npm run dev` (nodemon + ts-node-dev hoặc tương đương).
   - Production: `npm start`.
   - `src/index.js` tạo instance `ApplicationBootstrap`, gọi `await bootstrap.initialize()`, sau đó `app.listen(appConfig.port)`.

6. **Quy trình review**
   - Chạy `npm run lint` (nếu cấu hình). Nếu chưa có, ít nhất chạy `npm run test` hoặc `npm start` để chắc chắn build thành công.
   - Kiểm tra `bootstrap.js` đã đăng ký service mới chưa.
   - Đảm bảo tài liệu (README/ API docs) cập nhật tương ứng với thay đổi.
   - Kiểm tra `git status` đảm bảo không bỏ sót file quan trọng.

## 8. Checklist khi thêm bounded context mới

1. Tạo thư mục với cấu trúc domain/application/infrastructure/presentation như đã mô tả.
2. Định nghĩa domain model (aggregate, entity, value object, domain event) và repository interface.
3. Viết DTO + use case + application service. Mỗi use case nên nằm trong file riêng, có method `execute`.
4. Tạo schema + mapper + repository implementation trong infrastructure.
5. Tạo controller + routes, import use case/service thông qua DI container.
6. Đăng ký toàn bộ dependency trong `composition-root/bootstrap.js` (repository → service → controller → routes). Đảm bảo route mount vào Express app.
7. Cập nhật README này, ghi rõ bounded context mới và các endpoint chính.

## 9. Quick reference từng thư mục/chức năng

| Thư mục | Nội dung | File quan trọng | Công dụng |
|---------|----------|-----------------|-----------|
| `src/index.js` | Entry point | `startServer` | Khởi tạo `ApplicationBootstrap`, gọi `initialize`, sau đó `app.listen`. |
| `composition-root/` | DI, bootstrap | `container.js`, `bootstrap.js` | Quản lý dependency, đăng ký routes. |
| `presentation/` | HTTP generic | `app.js`, `http/middlewares/error.middleware.js`, `http/responses/*.js` | Cấu hình Express chung. |
| `bounded-contexts/<context>/domain/` | Domain logic | Aggregates, value objects, domain events, interfaces | Nơi chứa rule nghiệp vụ thuần. |
| `bounded-contexts/<context>/application/` | Use cases | DTO, services, use cases | Orchestrate domain + infrastructure. |
| `bounded-contexts/<context>/infrastructure/` | Persistence/external | Schemas, repositories, adapters | Giao tiếp Mongo/IPFS/Blockchain. |
| `bounded-contexts/<context>/presentation/` | API cụ thể | Controllers, routes | Define endpoints theo context. |
| `shared-kernel/` | Base classes | `domain/*`, `application/UnitOfWork.js`, `infrastructure/event-bus/*` | Toàn bộ entity/aggregate/value object nên extend từ đây để thống nhất hành vi. |
| `infrastructure/` | Cross-cutting config | `database/mongoose/connection.js`, `config/*.js`, file JSON deploy | Kết nối DB, load config, thông tin blockchain/IPFS dùng chung. |

Khi cần tìm logic cụ thể:
- Business rule → tìm trong domain aggregate của bounded context tương ứng.
- Flow request → tìm controller → service → use case → repository.
- Mapping DB ↔ domain → tìm mapper trong `infrastructure/persistence/mongoose/mappers`.
- Blockchain/IPFS → xem `supply-chain/infrastructure/blockchain` hoặc `external/ipfs`.

Tuân thủ tài liệu này sẽ giúp mọi developer nắm bắt nhanh, hiểu rõ vai trò từng thư mục và mở rộng source code mà không phá vỡ kiến trúc DDD đã thiết kế. Nếu có thay đổi đáng kể, hãy cập nhật README này để giữ tài liệu đồng bộ với code.

