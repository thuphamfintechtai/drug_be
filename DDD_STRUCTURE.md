# Cấu trúc DDD - Clean và Hoàn chỉnh

## 📁 Cấu trúc tổng quan

```
src/bounded-contexts/
├── identity-access/          ✅ Full DDD (Domain, Application, Infrastructure, Presentation)
├── registration/             ✅ Full DDD (Domain, Application, Infrastructure, Presentation)
├── supply-chain/             ✅ Full DDD (Domain, Application, Infrastructure, Presentation)
├── distributor/              ✅ Full DDD (Domain, Application, Infrastructure, Presentation)
├── pharmacy/                 ✅ Full DDD (Domain, Application, Infrastructure, Presentation)
├── admin/                    ✅ Query-focused (Application, Infrastructure, Presentation) - No Domain
├── statistics/               ✅ Query-focused (Domain/Repository, Application, Infrastructure, Presentation)
└── public/                   ✅ Query-focused (Application, Infrastructure, Presentation) - No Domain
```

## 🎯 Quy tắc DDD

### Bounded Contexts với Domain Layer đầy đủ:
- **identity-access**: Authentication, Authorization, User Management
- **registration**: Business Entity Registration
- **supply-chain**: Drug Manufacturing, Production, NFTs
- **distributor**: Distribution, Transfer to Pharmacy
- **pharmacy**: Pharmacy Receipt, Drug Delivery

### Bounded Contexts không có Domain Layer (Query-focused):
- **admin**: Chủ yếu là read operations, queries, không có domain logic phức tạp
- **public**: Public tracking APIs, không có domain logic
- **statistics**: Statistics queries, chỉ có Repository Interface trong Domain

## 📂 Cấu trúc chuẩn cho mỗi Bounded Context

### Full DDD Bounded Context:
```
bounded-context/
├── domain/
│   ├── aggregates/          # Aggregate Roots
│   ├── domain-events/       # Domain Events
│   ├── domain-services/     # Domain Services (optional)
│   ├── entities/            # Domain Entities (optional)
│   ├── exceptions/          # Domain Exceptions
│   ├── repositories/        # Repository Interfaces
│   └── value-objects/       # Value Objects
├── application/
│   ├── dto/                 # Data Transfer Objects
│   ├── services/            # Application Services
│   └── use-cases/           # Use Cases
├── infrastructure/
│   ├── persistence/         # Repository Implementations
│   ├── blockchain/          # Blockchain Adapters (optional)
│   └── external/            # External Services (optional)
├── presentation/
│   ├── controllers/         # Controllers
│   ├── routes/              # Routes
│   └── middleware/          # Middleware (optional)
└── index.js                 # Public API exports
```

### Query-focused Bounded Context (Admin, Public):
```
bounded-context/
├── application/
│   ├── dto/                 # DTOs (optional, nếu cần validation)
│   ├── services/            # Application Services
│   └── use-cases/           # Use Cases
├── infrastructure/
│   ├── blockchain/          # Blockchain Services (optional)
│   └── persistence/         # Query Repositories (optional)
├── presentation/
│   ├── controllers/         # Controllers
│   └── routes/              # Routes
└── index.js                 # Public API exports
```

### Statistics Bounded Context:
```
statistics/
├── domain/
│   └── repositories/        # Repository Interface only
├── application/
│   └── services/            # Application Services
├── infrastructure/
│   └── persistence/         # Repository Implementation
├── presentation/
│   ├── controllers/
│   └── routes/
└── index.js
```

## ✅ Đã Clean

1. ✅ **Đã xóa tất cả thư mục rỗng** - Không còn thư mục domain-services, entities, exceptions, value-objects rỗng
2. ✅ **Admin không có domain layer** - Đúng vì chủ yếu là query operations
3. ✅ **Public không có domain layer** - Đúng vì chủ yếu là query operations  
4. ✅ **Statistics chỉ có Repository Interface** - Đúng vì chủ yếu là query operations
5. ✅ **Cấu trúc nhất quán** - Tất cả bounded contexts có application/infrastructure/presentation

## 📝 Notes

- **Domain Services/Entities/Value Objects rỗng**: Đã được xóa - chỉ giữ lại khi thực sự cần thiết
- **Statistics không có DTOs**: Hợp lý vì chủ yếu là query operations, không cần validation phức tạp
- **Admin không có domain logic**: Đúng với DDD - admin chủ yếu là CRUD queries

## 🎯 Nguyên tắc

1. **Chỉ tạo thư mục khi cần thiết** - Không tạo thư mục trống
2. **Domain layer chỉ cho bounded contexts có domain logic** - Admin, Public không cần
3. **Repository Interface trong Domain** - Ngay cả cho query-focused contexts
4. **Cấu trúc nhất quán** - Tất cả có application/infrastructure/presentation

