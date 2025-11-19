# DEPRECATED FILES - MIGRATION IN PROGRESS

## ⚠️ CẢNH BÁO
Các file trong thư mục này đang được migrate sang cấu trúc DDD mới. 
**KHÔNG SỬ DỤNG** các file này cho code mới.

## Files đã được migrate:

### ✅ Hoàn toàn migrated:
- `controllers/authController.js` → `src/bounded-contexts/identity-access/`
- `controllers/userController.js` → `src/bounded-contexts/identity-access/`
- `routes/authRoutes.js` → `src/bounded-contexts/identity-access/`
- `routes/userRoutes.js` → `src/bounded-contexts/identity-access/`

### 🔄 Đang migrate:
- `controllers/pharmaCompanyController.js` → `src/bounded-contexts/supply-chain/` (partial)
- `controllers/distributorController.js` → `src/bounded-contexts/supply-chain/` (pending)
- `controllers/pharmacyController.js` → `src/bounded-contexts/supply-chain/` (pending)
- `controllers/adminController.js` → Multiple bounded contexts (pending)
- `controllers/statisticsController.js` → `src/bounded-contexts/statistics/` (pending)

### 📦 Services đã migrate:
- `services/emailService.js` → `src/bounded-contexts/registration/infrastructure/external/email/EmailService.js`
- `services/eventListenerService.js` → `src/bounded-contexts/supply-chain/infrastructure/blockchain/event-listeners/BlockchainEventListener.js`
- `services/ipfsService.js` → `src/bounded-contexts/supply-chain/infrastructure/external/ipfs/IPFSService.js`
- `services/blockchainService.js` → Đã được refactor thành adapters trong bounded contexts

## Models (giữ lại vì vẫn đang được dùng):
- `models/User.js` - Đang được dùng bởi infrastructure repositories
- `models/PharmaCompany.js` - Đang được dùng bởi registration bounded context
- `models/Distributor.js` - Đang được dùng bởi registration bounded context  
- `models/Pharmacy.js` - Đang được dùng bởi registration bounded context
- `models/DrugInfo.js` - Đang được dùng bởi supply-chain bounded context
- `models/NFTInfo.js` - Đang được dùng bởi supply-chain bounded context
- `models/RegistrationRequest.js` - Đang được dùng bởi registration bounded context
- Các models khác - Đang được dùng bởi event listeners và infrastructure

**LƯU Ý**: Models sẽ được migrate dần dần sang schemas trong infrastructure layer của từng bounded context.

## Timeline migration:
1. ✅ Identity-Access Bounded Context - COMPLETED
2. ✅ Registration Bounded Context - COMPLETED  
3. 🔄 Supply-Chain Bounded Context - IN PROGRESS
4. ⏳ Statistics Bounded Context - PENDING
5. ⏳ Admin Bounded Context - PENDING

## Cách sử dụng code mới:
Xem file `src/README.md` để biết cách sử dụng cấu trúc DDD mới.

