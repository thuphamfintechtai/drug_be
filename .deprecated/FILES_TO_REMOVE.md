# Files có thể xóa sau khi verify

## ⚠️ LƯU Ý
Chỉ xóa các file này SAU KHI đã verify toàn bộ ứng dụng hoạt động bình thường với cấu trúc DDD mới.

## Controllers cũ (KHÔNG còn được dùng trong src/index.js mới)
- ✅ `controllers/authController.js` → Đã migrate sang `src/bounded-contexts/identity-access/`
- ✅ `controllers/userController.js` → Đã migrate sang `src/bounded-contexts/identity-access/`
- ⚠️ `controllers/pharmaCompanyController.js` → Đang migrate sang `src/bounded-contexts/supply-chain/`
- ⚠️ `controllers/distributorController.js` → Chưa migrate
- ⚠️ `controllers/pharmacyController.js` → Chưa migrate
- ⚠️ `controllers/adminController.js` → Chưa migrate
- ✅ `controllers/statisticsController.js` → Đã migrate sang `src/bounded-contexts/statistics/`
- ⚠️ `controllers/publicController.js` → Chưa migrate

## Routes cũ (KHÔNG còn được dùng trong src/index.js mới)
- ✅ `routes/authRoutes.js` → Đã migrate sang `src/bounded-contexts/identity-access/`
- ✅ `routes/userRoutes.js` → Đã migrate sang `src/bounded-contexts/identity-access/`
- ⚠️ `routes/pharmaCompanyRoutes.js` → Đang migrate
- ⚠️ `routes/distributorRoutes.js` → Chưa migrate
- ⚠️ `routes/pharmacyRoutes.js` → Chưa migrate
- ⚠️ `routes/adminRoutes.js` → Chưa migrate
- ✅ `routes/statisticsRoutes.js` → Đã migrate sang `src/bounded-contexts/statistics/`
- ⚠️ `routes/publicRoutes.js` → Chưa migrate

## Services đã migrate (CÓ THỂ xóa sau khi verify)
- ✅ `services/emailService.js` → Đã migrate sang `src/bounded-contexts/registration/infrastructure/external/email/EmailService.js`
- ✅ `services/eventListenerService.js` → Đã migrate sang `src/bounded-contexts/supply-chain/infrastructure/blockchain/event-listeners/BlockchainEventListener.js`
- ✅ `services/ipfsService.js` → Đã migrate sang `src/bounded-contexts/supply-chain/infrastructure/external/ipfs/IPFSService.js`
- ⚠️ `services/blockchainService.js` → Một phần đã migrate (addManufacturer/addDistributor/addPharmacy → BlockchainAdapter), nhưng vẫn còn getTrackingHistory được dùng bởi controllers cũ

## Services vẫn đang được dùng
- ⚠️ `services/blockchainService.js` → Vẫn được dùng bởi controllers cũ (có thể migrate sau)
- ⚠️ `services/statistics/StatisticsFactory.js` → Đang được dùng bởi `StatisticsRepository` (adapter pattern)
- ⚠️ `services/factories/*` → Vẫn được dùng bởi controllers cũ
- ⚠️ `services/utils/*` → Vẫn được dùng bởi controllers cũ

## Models (GIỮ LẠI - vẫn đang được dùng bởi infrastructure)
- `models/User.js` → Đang được dùng bởi UserRepository
- `models/PharmaCompany.js` → Đang được dùng bởi BusinessEntityRepository
- `models/Distributor.js` → Đang được dùng bởi BusinessEntityRepository
- `models/Pharmacy.js` → Đang được dùng bởi BusinessEntityRepository
- `models/DrugInfo.js` → Đang được dùng bởi DrugInfoRepository
- `models/NFTInfo.js` → Đang được dùng bởi BlockchainEventListener
- `models/RegistrationRequest.js` → Đang được dùng bởi RegistrationRequestRepository
- Tất cả models khác → Vẫn đang được dùng bởi event listeners và infrastructure

## Utils (GIỮ LẠI - có thể migrate sau)
- `utils/*` → Vẫn có thể hữu ích, có thể migrate sang bounded contexts sau

## Middleware (KIỂM TRA)
- `middleware/authMiddleware.js` → Cần kiểm tra xem có được dùng bởi code mới không

## Entry Point cũ
- ✅ `index.js.old` → Backup của file cũ, có thể xóa sau khi verify

## Checklist trước khi xóa:
- [ ] Đã test tất cả API endpoints mới
- [ ] Đã verify không có code nào import từ controllers/routes cũ
- [ ] Đã backup code cũ (nếu cần)
- [ ] Đã update documentation
- [ ] Đã thông báo team về việc xóa file

