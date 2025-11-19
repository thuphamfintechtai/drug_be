# Drug Traceability Backend - DDD Architecture

## 📁 Cấu trúc DDD (Domain-Driven Design)

```
src/
├── bounded-contexts/          # Các Bounded Contexts
│   ├── identity-access/       # Quản lý người dùng và xác thực
│   ├── registration/          # Đăng ký doanh nghiệp
│   ├── supply-chain/          # Quản lý chuỗi cung ứng thuốc
│   └── statistics/            # Thống kê và báo cáo
│
├── shared-kernel/             # Code dùng chung
│   ├── domain/                # Base classes (Entity, AggregateRoot, etc.)
│   ├── application/           # UnitOfWork pattern
│   └── infrastructure/        # EventBus, Logger interfaces
│
├── infrastructure/            # Cross-cutting infrastructure
│   ├── database/              # MongoDB connection
│   └── config/                # Configuration files
│
├── presentation/              # HTTP layer
│   └── http/                  # Express app, middleware, responses
│
└── composition-root/          # Dependency Injection & Bootstrap
    ├── container.js           # DI Container
    └── bootstrap.js           # Application bootstrap
```

## 🎯 Bounded Contexts

### 1. Identity-Access
**Chức năng**: Quản lý người dùng, đăng nhập, đăng ký, reset mật khẩu

**Routes**: `/api/auth/*`, `/api/users/*`

**Domain Models**:
- `User` (Aggregate Root)
- `Session` (Aggregate Root)

**Use Cases**:
- `LoginUserUseCase`
- `RegisterUserUseCase`
- `ResetPasswordUseCase`

### 2. Registration
**Chức năng**: Đăng ký doanh nghiệp (PharmaCompany, Distributor, Pharmacy)

**Routes**: `/api/registration/*`

**Domain Models**:
- `RegistrationRequest` (Aggregate Root)

**Use Cases**:
- `SubmitRegistrationUseCase`
- `ApproveRegistrationUseCase`
- `RejectRegistrationUseCase`

### 3. Supply-Chain
**Chức năng**: Quản lý thuốc, NFT, chuyển giao trong chuỗi cung ứng

**Routes**: `/api/drugs/*`

**Domain Models**:
- `DrugInfo` (Aggregate Root)
- `NFT` (Aggregate Root) - TODO
- `Invoice` (Aggregate Root) - TODO

**Use Cases**:
- `CreateDrugUseCase`
- `ManufactureDrugUseCase` - TODO
- `MintNFTUseCase` - TODO
- `TransferDrugUseCase` - TODO

### 4. Statistics
**Chức năng**: Thống kê và báo cáo cho từng role

**Routes**: `/api/statistics/*`

**Application Services**:
- `StatisticsApplicationService`

## 🔧 Cách thêm Bounded Context mới

1. Tạo cấu trúc thư mục trong `bounded-contexts/`
2. Tạo Domain layer (aggregates, entities, value-objects, repositories)
3. Tạo Application layer (use-cases, services, DTOs)
4. Tạo Infrastructure layer (repositories implementation, external services)
5. Tạo Presentation layer (controllers, routes)
6. Wire vào `composition-root/bootstrap.js`

## 📝 Dependency Injection

Tất cả dependencies được quản lý qua DI Container trong `composition-root/container.js`.

### Ví dụ đăng ký service:
```javascript
this.container.register("myService", () => new MyService(), true);
```

### Ví dụ resolve service:
```javascript
const myService = this.container.resolve("myService");
```

## 🚀 Chạy ứng dụng

```bash
npm run dev    # Development mode với nodemon
npm start      # Production mode
```

Entry point: `src/index.js`

## 📚 Best Practices

1. **Domain Layer**: Chứa business logic thuần túy, không phụ thuộc vào framework
2. **Application Layer**: Orchestrate use cases, phối hợp giữa domain và infrastructure
3. **Infrastructure Layer**: Implement repositories, external services (database, email, blockchain)
4. **Presentation Layer**: HTTP controllers, routes, middleware

5. **Dependency Rule**: 
   - Domain ← Application ← Infrastructure
   - Domain ← Application ← Presentation
   - Infrastructure không được import Domain, chỉ implement interfaces

6. **Domain Events**: Sử dụng EventBus để publish domain events, giúp loose coupling giữa bounded contexts

## 🔄 Migration từ code cũ

Xem file `DEPRECATED.md` ở root để biết các file cũ đã được migrate.

Models cũ (`models/*`) vẫn được sử dụng tạm thời bởi infrastructure layer cho đến khi migrate hoàn toàn sang schemas trong bounded contexts.

