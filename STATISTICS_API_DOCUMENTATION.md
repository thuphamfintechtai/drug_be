# 📊 TÀI LIỆU API THỐNG KÊ (STATISTICS API)

## 📋 TỔNG QUAN

Tài liệu này liệt kê **TẤT CẢ** các API thống kê trong hệ thống, bao gồm:

### Base URLs:
- `/api/statistics` - Statistics APIs chung
- `/api/pharma-company` - APIs dành cho Manufacturer
- `/api/distributor` - APIs dành cho Distributor  
- `/api/pharmacy` - APIs dành cho Pharmacy
- `/api/admin` - APIs dành cho Admin
- `/api/users` - APIs dành cho User (một số API thống kê)

### Tổng số API: **41 APIs**

### Phân loại:
1. **Dashboard Statistics** (3 APIs) - Thống kê dashboard tổng quan
2. **Supply Chain Statistics** (2 APIs) - Thống kê chuỗi cung ứng
3. **Quality Statistics** (1 API) - Thống kê chất lượng
4. **Blockchain Statistics** (1 API) - Thống kê blockchain
5. **Alerts Statistics** (1 API) - Thống kê cảnh báo
6. **Trends Statistics** (1 API) - Thống kê xu hướng
7. **Product Analytics** (1 API) - Phân tích sản phẩm
8. **Performance Metrics** (1 API) - Thống kê hiệu suất
9. **Compliance Statistics** (1 API) - Thống kê tuân thủ
10. **Admin Statistics** (4 APIs) - Thống kê hệ thống (Admin only)
11. **Role-Specific Statistics** (3 APIs) - Thống kê riêng cho từng role
12. **Chart Statistics** (14 APIs) - Thống kê biểu đồ
13. **Admin Tracking & Monitoring** (5 APIs) - Theo dõi và giám sát (Admin only)

---

## 🔐 AUTHENTICATION & AUTHORIZATION

**Lưu ý:** Tất cả các API đều yêu cầu:
- ✅ **Authentication:** Header `Authorization: Bearer <token>`
- ✅ **Authorization:** Một số API yêu cầu role cụ thể:
  - `pharma_company` - Nhà sản xuất
  - `distributor` - Nhà phân phối
  - `pharmacy` - Nhà thuốc
  - `system_admin` - Quản trị viên hệ thống

---

## 🎯 1. DASHBOARD STATISTICS

### 1.1. Dashboard Manufacturer (Nhà sản xuất)
**Endpoint:** `GET /api/statistics/manufacturer/dashboard`  
**Authorization:** `pharma_company`  
**Mô tả:** Lấy thống kê tổng quan dashboard cho nhà sản xuất

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalDrugs": 50,
      "activeDrugs": 45,
      "totalProductions": 200,
      "totalQuantityProduced": 15000,
      "totalNFTs": 1800,
      "totalTransfers": 150
    },
    "timeBased": {
      "today": { "productions": 5 },
      "thisWeek": { "productions": 25 },
      "thisMonth": { "productions": 80, "quantity": 6000 }
    },
    "nfts": {
      "total": 1800,
      "byStatus": {
        "minted": 1200,
        "transferred": 400,
        "sold": 150,
        "expired": 30,
        "recalled": 20
      }
    },
    "transfers": {
      "total": 150,
      "byStatus": {
        "pending": 10,
        "sent": 50,
        "paid": 85,
        "cancelled": 5
      }
    },
    "trends": {
      "dailyProductions": [
        {
          "date": "2024-01-01",
          "count": 5,
          "quantity": 500
        }
      ]
    },
    "topProducts": [
      {
        "drugName": "Paracetamol 500mg",
        "atcCode": "N02BE01",
        "nftCount": 300,
        "status": "active"
      }
    ]
  }
}
```

---

### 1.2. Dashboard Distributor (Nhà phân phối)
**Endpoint:** `GET /api/statistics/distributor/dashboard`  
**Authorization:** `distributor`  
**Mô tả:** Lấy thống kê tổng quan dashboard cho nhà phân phối

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalInvoicesReceived": 100,
      "totalDistributions": 80,
      "totalTransfersToPharmacy": 70,
      "totalNFTs": 500
    },
    "invoicesReceived": {
      "total": 100,
      "byStatus": {
        "pending": 10,
        "sent": 30,
        "paid": 60
      }
    },
    "distributions": {
      "total": 80,
      "byStatus": {
        "pending": 5,
        "confirmed": 20,
        "delivered": 55
      }
    },
    "transfersToPharmacy": {
      "total": 70,
      "byStatus": {
        "draft": 5,
        "sent": 25,
        "paid": 40
      }
    },
    "nfts": {
      "total": 500,
      "byStatus": {
        "transferred": 400,
        "sold": 100
      }
    },
    "trends": {
      "dailyStats": [
        {
          "date": "2024-01-01",
          "invoicesReceived": 5,
          "transfersToPharmacy": 3
        }
      ]
    }
  }
}
```

---

### 1.3. Dashboard Pharmacy (Nhà thuốc)
**Endpoint:** `GET /api/statistics/pharmacy/dashboard`  
**Authorization:** `pharmacy`  
**Mô tả:** Lấy thống kê tổng quan dashboard cho nhà thuốc

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalInvoicesReceived": 50,
      "totalReceipts": 45,
      "totalNFTs": 200,
      "completedSupplyChains": 40
    },
    "invoicesReceived": {
      "total": 50,
      "byStatus": {
        "draft": 2,
        "issued": 5,
        "sent": 15,
        "paid": 28
      }
    },
    "receipts": {
      "total": 45,
      "byStatus": {
        "pending": 3,
        "received": 10,
        "verified": 20,
        "completed": 12
      }
    },
    "nfts": {
      "total": 200,
      "byStatus": {
        "minted": 50,
        "transferred": 100,
        "sold": 40,
        "expired": 10
      }
    },
    "supplyChain": {
      "completed": 40,
      "completionRate": "80"
    },
    "trends": {
      "dailyStats": [
        {
          "date": "2024-01-01",
          "invoicesReceived": 2,
          "receipts": 1
        }
      ]
    }
  }
}
```

---

## 🔗 2. SUPPLY CHAIN STATISTICS

### 2.1. Supply Chain Stats - Manufacturer
**Endpoint:** `GET /api/statistics/manufacturer/supply-chain`  
**Authorization:** `pharma_company`  
**Mô tả:** Thống kê chuỗi cung ứng từ góc nhìn nhà sản xuất

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTransfers": 150,
    "uniqueDistributors": 10,
    "totalQuantityTransferred": 12000,
    "avgDaysToTransfer": "5.50",
    "transfersByStatus": {
      "pending": 10,
      "sent": 50,
      "paid": 90
    }
  }
}
```

---

### 2.2. Supply Chain Stats - Distributor
**Endpoint:** `GET /api/statistics/distributor/supply-chain`  
**Authorization:** `distributor`  
**Mô tả:** Thống kê chuỗi cung ứng từ góc nhìn nhà phân phối

**Response:**
```json
{
  "success": true,
  "data": {
    "uniqueManufacturers": 5,
    "uniquePharmacies": 15,
    "totalQuantityReceived": 10000,
    "totalQuantitySent": 8000,
    "avgDaysToTransfer": "3.25",
    "inventory": 2000
  }
}
```

---

## ✅ 3. QUALITY STATISTICS

### 3.1. Quality Stats - Pharmacy
**Endpoint:** `GET /api/statistics/pharmacy/quality`  
**Authorization:** `pharmacy`  
**Mô tả:** Thống kê chất lượng sản phẩm tại nhà thuốc

**Response:**
```json
{
  "success": true,
  "data": {
    "qualityChecks": {
      "total": 45,
      "passed": 40,
      "failed": 5,
      "passRate": "88.89"
    },
    "expiration": {
      "expired": 2,
      "expiringSoon": 8
    }
  }
}
```

---

## ⛓️ 4. BLOCKCHAIN STATISTICS

### 4.1. Blockchain Stats (Tất cả roles)
**Endpoint:** `GET /api/statistics/blockchain`  
**Authorization:** Không yêu cầu role cụ thể (chỉ cần authenticated)  
**Mô tả:** Thống kê blockchain dựa trên role của user (manufacturer/distributor/pharmacy)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalNFTs": 1800,
    "nftsWithTxHash": 1700,
    "blockchainCoverage": "94.44%",
    "nftsByStatus": {
      "minted": 1200,
      "transferred": 400,
      "sold": 150,
      "expired": 30,
      "recalled": 20
    }
  }
}
```

---

## 🚨 5. ALERTS STATISTICS

### 5.1. Alerts Stats (Tất cả roles)
**Endpoint:** `GET /api/statistics/alerts`  
**Authorization:** Không yêu cầu role cụ thể (chỉ cần authenticated)  
**Mô tả:** Thống kê cảnh báo dựa trên role của user

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": {
      "expired": 5,
      "expiringSoon": 15,
      "recalled": 2,
      "pendingActions": 10
    },
    "totalAlerts": 32
  }
}
```

**Lưu ý:** 
- `expired`: Sản phẩm đã hết hạn nhưng chưa được đánh dấu
- `expiringSoon`: Sản phẩm sắp hết hạn (trong 30 ngày tới)
- `recalled`: Sản phẩm bị thu hồi
- `pendingActions`: Các hành động đang chờ xử lý

---

## 📈 6. TRENDS STATISTICS

### 6.1. Monthly Trends
**Endpoint:** `GET /api/statistics/trends/monthly`  
**Query Parameters:**
- `months` (optional): Số tháng muốn lấy (mặc định: 6)

**Authorization:** Không yêu cầu role cụ thể (chỉ cần authenticated)  
**Mô tả:** Thống kê xu hướng theo tháng dựa trên role của user

**Ví dụ:** `GET /api/statistics/trends/monthly?months=6`

**Response:**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "month": "2024-01",
        "productions": 80,
        "transfers": 60,
        "receipts": 0
      },
      {
        "month": "2024-02",
        "productions": 90,
        "transfers": 70,
        "receipts": 0
      }
    ],
    "period": "6 tháng gần nhất"
  }
}
```

**Lưu ý:** 
- Manufacturer: `productions` và `transfers` có dữ liệu
- Distributor: chỉ `transfers` có dữ liệu
- Pharmacy: chỉ `receipts` có dữ liệu

---

## 📦 7. PRODUCT ANALYTICS

### 7.1. Product Analytics - Manufacturer
**Endpoint:** `GET /api/statistics/manufacturer/products`  
**Authorization:** `pharma_company`  
**Mô tả:** Phân tích chi tiết từng sản phẩm của nhà sản xuất

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "drugId": "507f1f77bcf86cd799439011",
        "tradeName": "Paracetamol 500mg",
        "atcCode": "N02BE01",
        "status": "active",
        "totalProductions": 50,
        "totalQuantity": 5000,
        "totalNFTs": 300,
        "nftsByStatus": {
          "minted": 200,
          "transferred": 80,
          "sold": 15,
          "expired": 3,
          "recalled": 2
        }
      }
    ],
    "totalProducts": 10
  }
}
```

---

## 🎯 8. PERFORMANCE METRICS

### 8.1. Performance Metrics
**Endpoint:** `GET /api/statistics/performance`  
**Query Parameters:**
- `startDate` (optional): Ngày bắt đầu (format: YYYY-MM-DD)
- `endDate` (optional): Ngày kết thúc (format: YYYY-MM-DD)

**Authorization:** Không yêu cầu role cụ thể (chỉ cần authenticated)  
**Mô tả:** Thống kê hiệu suất dựa trên role của user

**Ví dụ:** `GET /api/statistics/performance?startDate=2024-01-01&endDate=2024-01-31`

**Response (Manufacturer):**
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2023-12-01T00:00:00.000Z",
      "to": "2024-01-31T23:59:59.999Z"
    },
    "metrics": {
      "avgProductionToTransferDays": "5.50",
      "totalProductions": 80
    }
  }
}
```

**Response (Distributor):**
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2023-12-01T00:00:00.000Z",
      "to": "2024-01-31T23:59:59.999Z"
    },
    "metrics": {
      "avgDistributionToTransferDays": "3.25",
      "totalDistributions": 60
    }
  }
}
```

**Response (Pharmacy):**
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2023-12-01T00:00:00.000Z",
      "to": "2024-01-31T23:59:59.999Z"
    },
    "metrics": {
      "avgReceiptToCompletionDays": "2.10",
      "totalReceipts": 45,
      "completedSupplyChains": 40
    }
  }
}
```

---

## 📋 9. COMPLIANCE STATISTICS

### 9.1. Compliance Stats
**Endpoint:** `GET /api/statistics/compliance`  
**Authorization:** Không yêu cầu role cụ thể (chỉ cần authenticated)  
**Mô tả:** Thống kê tuân thủ dựa trên role của user

**Response (Manufacturer):**
```json
{
  "success": true,
  "data": {
    "compliance": {
      "blockchainTransactions": 180,
      "totalRecords": 200,
      "complianceRate": "90",
      "missingData": [
        {
          "field": "batchNumber",
          "count": 5
        },
        {
          "field": "expDate",
          "count": 15
        }
      ]
    }
  }
}
```

**Response (Distributor):**
```json
{
  "success": true,
  "data": {
    "compliance": {
      "blockchainTransactions": 75,
      "totalRecords": 80,
      "complianceRate": "93.75",
      "missingData": []
    }
  }
}
```

**Response (Pharmacy):**
```json
{
  "success": true,
  "data": {
    "compliance": {
      "blockchainTransactions": 40,
      "totalRecords": 45,
      "complianceRate": "88.89",
      "missingData": [
        {
          "field": "qualityCheck",
          "count": 5
        }
      ]
    }
  }
}
```

---

## 🔐 10. ADMIN STATISTICS (Admin Only)

### 10.1. System Statistics
**Endpoint:** `GET /api/admin/statistics`  
**Authorization:** `system_admin`  
**Mô tả:** Thống kê tổng quan hệ thống (chỉ dành cho admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 100,
      "byRole": {
        "user": 10,
        "system_admin": 2,
        "pharma_company": 15,
        "distributor": 25,
        "pharmacy": 48
      },
      "byStatus": {
        "active": 80,
        "inactive": 10,
        "banned": 5,
        "pending": 5
      }
    },
    "businesses": {
      "pharmaCompanies": 15,
      "distributors": 25,
      "pharmacies": 48
    },
    "drugs": {
      "total": 500,
      "active": 450
    },
    "nfts": {
      "total": 5000,
      "byStatus": {
        "minted": 3000,
        "transferred": 1500,
        "sold": 400,
        "expired": 80,
        "recalled": 20
      }
    },
    "invoices": {
      "manufacturer": 500,
      "commercial": 800
    },
    "proofs": {
      "production": 500,
      "distribution": 400,
      "pharmacy": 350
    }
  }
}
```

---

### 10.2. Registration Statistics
**Endpoint:** `GET /api/admin/registration/statistics`  
**Authorization:** `system_admin`  
**Mô tả:** Thống kê đơn đăng ký

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "byStatus": {
      "pending": 10,
      "approved_pending_blockchain": 5,
      "approved": 30,
      "blockchain_failed": 3,
      "rejected": 2
    },
    "byRole": {
      "pharma_company": 15,
      "distributor": 20,
      "pharmacy": 15
    },
    "recentRequests": 8
  }
}
```

---

### 10.3. Drug Statistics
**Endpoint:** `GET /api/admin/drugs/statistics`  
**Authorization:** `system_admin`  
**Mô tả:** Thống kê thuốc trong hệ thống

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 500,
    "byStatus": {
      "active": 450,
      "inactive": 40,
      "recalled": 10
    },
    "byManufacturer": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "count": 50,
        "manufacturerInfo": {
          "companyName": "Công ty Dược phẩm ABC"
        }
      }
    ]
  }
}
```

---

### 10.4. User Statistics
**Endpoint:** `GET /api/users/stats`  
**Authorization:** `system_admin`  
**Mô tả:** Thống kê người dùng trong hệ thống

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "byRole": {
      "user": 10,
      "system_admin": 2,
      "pharma_company": 15,
      "distributor": 25,
      "pharmacy": 48
    },
    "byStatus": {
      "active": 80,
      "inactive": 10,
      "banned": 5,
      "pending": 5
    }
  }
}
```

---

## 📊 11. ROLE-SPECIFIC STATISTICS (Statistics riêng cho từng role)

### 11.1. Statistics - Manufacturer
**Endpoint:** `GET /api/pharma-company/statistics`  
**Authorization:** `pharma_company`  
**Mô tả:** Thống kê tổng quan cho nhà sản xuất (khác với dashboard statistics)

**Response:**
```json
{
  "success": true,
  "data": {
    "drugs": {
      "total": 50,
      "active": 45,
      "inactive": 5
    },
    "productions": {
      "total": 200
    },
    "nfts": {
      "total": 1800,
      "byStatus": {
        "minted": 1200,
        "transferred": 400,
        "sold": 150,
        "expired": 30,
        "recalled": 20
      }
    },
    "transfers": {
      "total": 150,
      "byStatus": {
        "pending": 10,
        "sent": 50,
        "paid": 85,
        "cancelled": 5
      }
    }
  }
}
```

---

### 11.2. Statistics - Distributor
**Endpoint:** `GET /api/distributor/statistics`  
**Authorization:** `distributor`  
**Mô tả:** Thống kê tổng quan cho nhà phân phối

**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": {
      "total": 100,
      "byStatus": {
        "pending": 10,
        "sent": 30,
        "paid": 60
      }
    },
    "distributions": {
      "total": 80,
      "byStatus": {
        "pending": 5,
        "in_transit": 10,
        "delivered": 50,
        "confirmed": 12,
        "rejected": 3
      }
    },
    "transfersToPharmacy": {
      "total": 70,
      "byStatus": {
        "draft": 5,
        "sent": 25,
        "paid": 40
      }
    },
    "nfts": {
      "total": 500,
      "byStatus": {
        "transferred": 400,
        "sold": 100
      }
    }
  }
}
```

---

### 11.3. Statistics - Pharmacy
**Endpoint:** `GET /api/pharmacy/statistics`  
**Authorization:** `pharmacy`  
**Mô tả:** Thống kê tổng quan cho nhà thuốc

**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": {
      "total": 50,
      "byStatus": {
        "draft": 2,
        "issued": 5,
        "sent": 15,
        "paid": 25,
        "cancelled": 3
      }
    },
    "receipts": {
      "total": 45,
      "byStatus": {
        "pending": 3,
        "received": 10,
        "verified": 20,
        "completed": 10,
        "rejected": 2
      }
    },
    "transfers": {
      "total": 45
    },
    "nfts": {
      "total": 200,
      "byStatus": {
        "minted": 50,
        "transferred": 100,
        "sold": 40,
        "expired": 8,
        "recalled": 2
      }
    }
  }
}
```

---

## 📈 12. CHART STATISTICS (Thống kê biểu đồ)

### 12.1. Chart One Week - Manufacturer
**Endpoint:** `GET /api/pharma-company/chart/one-week`  
**Authorization:** `pharma_company`  
**Mô tả:** Thống kê sản xuất 7 ngày gần nhất

**Response:**
```json
{
  "success": true,
  "data": {
    "productions": [
      {
        "_id": "...",
        "drug": {
          "tradeName": "Paracetamol 500mg",
          "atcCode": "N02BE01"
        },
        "quantity": 1000,
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "count": 35,
    "from": "2024-01-08T00:00:00.000Z",
    "to": "2024-01-15T23:59:59.999Z",
    "dailyStats": {
      "2024-01-15": {
        "count": 5,
        "quantity": 5000,
        "productions": [...]
      }
    }
  }
}
```

---

### 12.2. Chart Today Yesterday - Manufacturer
**Endpoint:** `GET /api/pharma-company/chart/today-yesterday`  
**Authorization:** `pharma_company`  
**Mô tả:** So sánh sản xuất hôm nay và hôm qua

**Response:**
```json
{
  "success": true,
  "data": {
    "todayCount": 5,
    "yesterdayCount": 3,
    "diff": 2,
    "percentChange": "66.67",
    "todayProductionsCount": 5,
    "todayProductions": [...],
    "period": {
      "yesterdayFrom": "2024-01-14T00:00:00.000Z",
      "yesterdayTo": "2024-01-14T23:59:59.999Z",
      "todayFrom": "2024-01-15T00:00:00.000Z",
      "now": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

---

### 12.3. Chart Productions By Date Range - Manufacturer
**Endpoint:** `GET /api/pharma-company/chart/productions-by-date-range`  
**Query Parameters:**
- `startDate` (required): Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (required): Ngày kết thúc (YYYY-MM-DD)

**Authorization:** `pharma_company`  
**Mô tả:** Thống kê sản xuất theo khoảng thời gian

**Response:**
```json
{
  "success": true,
  "data": {
    "dateRange": {
      "from": "2024-01-01T00:00:00.000Z",
      "to": "2024-01-31T23:59:59.999Z",
      "days": 31
    },
    "summary": {
      "totalProductions": 80,
      "totalQuantity": 80000,
      "averagePerDay": "2.58"
    },
    "dailyStats": {
      "2024-01-15": {
        "count": 5,
        "quantity": 5000,
        "productions": [...]
      }
    },
    "productions": [...]
  }
}
```

---

### 12.4. Chart Distributions By Date Range - Manufacturer
**Endpoint:** `GET /api/pharma-company/chart/distributions-by-date-range`  
**Query Parameters:**
- `startDate` (required): Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (required): Ngày kết thúc (YYYY-MM-DD)

**Authorization:** `pharma_company`  
**Mô tả:** Thống kê phân phối theo khoảng thời gian

**Response:**
```json
{
  "success": true,
  "data": {
    "dateRange": {
      "from": "2024-01-01T00:00:00.000Z",
      "to": "2024-01-31T23:59:59.999Z",
      "days": 31
    },
    "summary": {
      "totalDistribution": 60,
      "totalQuantity": 60000,
      "averagePerDay": "1.94"
    },
    "dailyStats": {
      "2024-01-15": {
        "count": 3,
        "quantity": 3000,
        "distributions": [...]
      }
    },
    "distributions": [...]
  }
}
```

---

### 12.5. Chart Transfers By Date Range - Manufacturer
**Endpoint:** `GET /api/pharma-company/chart/transfers-by-date-range`  
**Query Parameters:**
- `startDate` (required): Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (required): Ngày kết thúc (YYYY-MM-DD)

**Authorization:** `pharma_company`  
**Mô tả:** Thống kê chuyển giao cho distributor theo khoảng thời gian

**Response:**
```json
{
  "success": true,
  "data": {
    "dateRange": {
      "from": "2024-01-01T00:00:00.000Z",
      "to": "2024-01-31T23:59:59.999Z",
      "days": 31
    },
    "summary": {
      "totalInvoices": 50,
      "totalQuantity": 50000,
      "averagePerDay": "1.61"
    },
    "dailyStats": {
      "2024-01-15": {
        "count": 2,
        "quantity": 2000,
        "invoices": [...]
      }
    },
    "invoices": [...]
  }
}
```

---

### 12.6. Chart One Week - Distributor
**Endpoint:** `GET /api/distributor/chart/one-week`  
**Authorization:** `distributor`  
**Mô tả:** Thống kê đơn hàng nhận từ manufacturer 7 ngày gần nhất

**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": [...],
    "count": 25,
    "from": "2024-01-08T00:00:00.000Z",
    "to": "2024-01-15T23:59:59.999Z",
    "dailyStats": {
      "2024-01-15": {
        "count": 3,
        "quantity": 3000,
        "invoices": [...]
      }
    }
  }
}
```

---

### 12.7. Chart Today Yesterday - Distributor
**Endpoint:** `GET /api/distributor/chart/today-yesterday`  
**Authorization:** `distributor`  
**Mô tả:** So sánh đơn hàng nhận hôm nay và hôm qua

**Response:**
```json
{
  "success": true,
  "data": {
    "todayCount": 3,
    "yesterdayCount": 2,
    "diff": 1,
    "percentChange": "50.00",
    "todayInvoicesCount": 3,
    "todayInvoices": [...],
    "period": {
      "yesterdayFrom": "2024-01-14T00:00:00.000Z",
      "yesterdayTo": "2024-01-14T23:59:59.999Z",
      "todayFrom": "2024-01-15T00:00:00.000Z",
      "now": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

---

### 12.8. Chart Invoices By Date Range - Distributor
**Endpoint:** `GET /api/distributor/chart/invoices-by-date-range`  
**Query Parameters:**
- `startDate` (required): Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (required): Ngày kết thúc (YYYY-MM-DD)

**Authorization:** `distributor`  
**Mô tả:** Thống kê đơn hàng nhận từ manufacturer theo khoảng thời gian

**Response:**
```json
{
  "success": true,
  "data": {
    "dateRange": {
      "from": "2024-01-01T00:00:00.000Z",
      "to": "2024-01-31T23:59:59.999Z",
      "days": 31
    },
    "summary": {
      "totalInvoices": 50,
      "totalQuantity": 50000,
      "averagePerDay": "1.61"
    },
    "dailyStats": {
      "2024-01-15": {
        "count": 2,
        "quantity": 2000,
        "invoices": [...]
      }
    },
    "invoices": [...]
  }
}
```

---

### 12.9. Chart Distributions By Date Range - Distributor
**Endpoint:** `GET /api/distributor/chart/distributions-by-date-range`  
**Query Parameters:**
- `startDate` (required): Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (required): Ngày kết thúc (YYYY-MM-DD)

**Authorization:** `distributor`  
**Mô tả:** Thống kê phân phối theo khoảng thời gian

**Response:**
```json
{
  "success": true,
  "data": {
    "dateRange": {
      "from": "2024-01-01T00:00:00.000Z",
      "to": "2024-01-31T23:59:59.999Z",
      "days": 31
    },
    "summary": {
      "totalDistributions": 40,
      "totalQuantity": 40000,
      "averagePerDay": "1.29"
    },
    "dailyStats": {
      "2024-01-15": {
        "count": 2,
        "quantity": 2000,
        "distributions": [...]
      }
    },
    "distributions": [...]
  }
}
```

---

### 12.10. Chart Transfers To Pharmacy By Date Range - Distributor
**Endpoint:** `GET /api/distributor/chart/transfers-to-pharmacy-by-date-range`  
**Query Parameters:**
- `startDate` (required): Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (required): Ngày kết thúc (YYYY-MM-DD)

**Authorization:** `distributor`  
**Mô tả:** Thống kê chuyển giao cho pharmacy theo khoảng thời gian

**Response:**
```json
{
  "success": true,
  "data": {
    "dateRange": {
      "from": "2024-01-01T00:00:00.000Z",
      "to": "2024-01-31T23:59:59.999Z",
      "days": 31
    },
    "summary": {
      "totalInvoices": 35,
      "totalQuantity": 35000,
      "averagePerDay": "1.13"
    },
    "dailyStats": {
      "2024-01-15": {
        "count": 1,
        "quantity": 1000,
        "invoices": [...]
      }
    },
    "invoices": [...]
  }
}
```

---

### 12.11. Chart One Week - Pharmacy
**Endpoint:** `GET /api/pharmacy/chart/one-week`  
**Authorization:** `pharmacy`  
**Mô tả:** Thống kê đơn hàng nhận từ distributor 7 ngày gần nhất

**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": [...],
    "count": 15,
    "from": "2024-01-08T00:00:00.000Z",
    "to": "2024-01-15T23:59:59.999Z",
    "dailyStats": {
      "2024-01-15": {
        "count": 2,
        "quantity": 2000,
        "invoices": [...]
      }
    }
  }
}
```

---

### 12.12. Chart Today Yesterday - Pharmacy
**Endpoint:** `GET /api/pharmacy/chart/today-yesterday`  
**Authorization:** `pharmacy`  
**Mô tả:** So sánh đơn hàng nhận hôm nay và hôm qua

**Response:**
```json
{
  "success": true,
  "data": {
    "todayCount": 2,
    "yesterdayCount": 1,
    "diff": 1,
    "percentChange": "100.00",
    "todayInvoicesCount": 2,
    "todayInvoices": [...],
    "period": {
      "yesterdayFrom": "2024-01-14T00:00:00.000Z",
      "yesterdayTo": "2024-01-14T23:59:59.999Z",
      "todayFrom": "2024-01-15T00:00:00.000Z",
      "now": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

---

### 12.13. Chart Invoices By Date Range - Pharmacy
**Endpoint:** `GET /api/pharmacy/chart/invoices-by-date-range`  
**Query Parameters:**
- `startDate` (required): Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (required): Ngày kết thúc (YYYY-MM-DD)

**Authorization:** `pharmacy`  
**Mô tả:** Thống kê đơn hàng nhận từ distributor theo khoảng thời gian

**Response:**
```json
{
  "success": true,
  "data": {
    "dateRange": {
      "from": "2024-01-01T00:00:00.000Z",
      "to": "2024-01-31T23:59:59.999Z",
      "days": 31
    },
    "summary": {
      "totalInvoices": 30,
      "totalQuantity": 30000,
      "averagePerDay": "0.97"
    },
    "dailyStats": {
      "2024-01-15": {
        "count": 1,
        "quantity": 1000,
        "invoices": [...]
      }
    },
    "invoices": [...]
  }
}
```

---

### 12.14. Chart Receipts By Date Range - Pharmacy
**Endpoint:** `GET /api/pharmacy/chart/receipts-by-date-range`  
**Query Parameters:**
- `startDate` (required): Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (required): Ngày kết thúc (YYYY-MM-DD)

**Authorization:** `pharmacy`  
**Mô tả:** Thống kê biên nhận theo khoảng thời gian

**Response:**
```json
{
  "success": true,
  "data": {
    "dateRange": {
      "from": "2024-01-01T00:00:00.000Z",
      "to": "2024-01-31T23:59:59.999Z",
      "days": 31
    },
    "summary": {
      "totalReceipts": 28,
      "totalQuantity": 28000,
      "averagePerDay": "0.90"
    },
    "dailyStats": {
      "2024-01-15": {
        "count": 1,
        "quantity": 1000,
        "receipts": [...]
      }
    },
    "receipts": [...]
  }
}
```

---

## 🔍 13. ADMIN TRACKING & MONITORING (Admin Only)

### 13.1. Supply Chain History
**Endpoint:** `GET /api/admin/supply-chain/history`  
**Query Parameters:**
- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số lượng mỗi trang (mặc định: 20)
- `tokenId` (optional): Lọc theo tokenId

**Authorization:** `system_admin`  
**Mô tả:** Lịch sử chuỗi cung ứng (tất cả các giai đoạn)

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "stage": "production",
        "stageName": "Sản xuất",
        "id": "...",
        "drug": {...},
        "manufacturer": {...},
        "quantity": 1000,
        "mfgDate": "2024-01-01",
        "expDate": "2025-01-01",
        "chainTxHash": "0x...",
        "createdAt": "2024-01-01T10:00:00.000Z"
      },
      {
        "stage": "transfer_to_distributor",
        "stageName": "Chuyển giao cho Nhà phân phối",
        "id": "...",
        "invoiceNumber": "INV-001",
        "drug": {...},
        "fromManufacturer": {...},
        "toDistributor": {...},
        "quantity": 1000,
        "status": "paid",
        "chainTxHash": "0x...",
        "createdAt": "2024-01-02T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

### 13.2. Distribution History
**Endpoint:** `GET /api/admin/distribution/history`  
**Query Parameters:**
- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số lượng mỗi trang (mặc định: 20)
- `distributorId` (optional): Lọc theo distributor
- `pharmacyId` (optional): Lọc theo pharmacy
- `drugId` (optional): Lọc theo drug
- `status` (optional): Lọc theo status
- `startDate` (optional): Ngày bắt đầu
- `endDate` (optional): Ngày kết thúc

**Authorization:** `system_admin`  
**Mô tả:** Lịch sử phân phối từ distributor đến pharmacy

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "type": "commercial_invoice",
        "invoiceNumber": "CI-001",
        "fromDistributor": {...},
        "toPharmacy": {...},
        "drug": {...},
        "quantity": 500,
        "status": "paid",
        "createdAt": "2024-01-05T10:00:00.000Z"
      },
      {
        "type": "proof_of_pharmacy",
        "fromDistributor": {...},
        "toPharmacy": {...},
        "receivedQuantity": 500,
        "status": "completed",
        "supplyChainCompleted": true,
        "createdAt": "2024-01-06T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

---

### 13.3. Batch List
**Endpoint:** `GET /api/admin/batch-tracking/batches`  
**Query Parameters:**
- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số lượng mỗi trang (mặc định: 20)
- `batchNumber` (optional): Tìm kiếm theo batch number
- `manufacturer` (optional): Lọc theo manufacturer ID
- `status` (optional): Lọc theo status (produced, in_transit, completed)
- `drugName` (optional): Tìm kiếm theo tên thuốc
- `fromDate` (optional): Ngày sản xuất từ
- `toDate` (optional): Ngày sản xuất đến

**Authorization:** `system_admin`  
**Mô tả:** Danh sách các lô sản xuất với thống kê

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "batchNumber": "BATCH-001",
      "drug": {
        "drugName": "Paracetamol 500mg",
        "registrationNo": "VN-12345"
      },
      "manufacturer": {
        "name": "Công ty Dược phẩm ABC",
        "licenseNo": "LIC-001",
        "address": "123 Đường ABC"
      },
      "mfgDate": "2024-01-01",
      "expDate": "2025-01-01",
      "totalQuantity": 10000,
      "nftCount": 1000,
      "distributedCount": 800,
      "completedCount": 600,
      "status": "in_transit",
      "chainTxHash": "0x...",
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 13.4. Batch Journey
**Endpoint:** `GET /api/admin/batch-tracking/batches/:batchNumber/journey`  
**Path Parameters:**
- `batchNumber` (required): Số lô

**Authorization:** `system_admin`  
**Mô tả:** Hành trình chi tiết của một lô sản xuất

**Response:**
```json
{
  "success": true,
  "data": {
    "batchInfo": {
      "batchNumber": "BATCH-001",
      "drug": {...},
      "manufacturer": {...},
      "mfgDate": "2024-01-01",
      "expDate": "2025-01-01",
      "quantity": 10000,
      "chainTxHash": "0x...",
      "createdAt": "2024-01-01T10:00:00.000Z"
    },
    "timeline": [
      {
        "step": 1,
        "stage": "production",
        "timestamp": "2024-01-01T10:00:00.000Z",
        "entity": {
          "type": "pharma_company",
          "name": "Công ty Dược phẩm ABC",
          "licenseNo": "LIC-001",
          "address": "123 Đường ABC",
          "walletAddress": "0x..."
        },
        "details": {
          "batchNumber": "BATCH-001",
          "drug": {...},
          "quantity": 10000,
          "mfgDate": "2024-01-01",
          "expDate": "2025-01-01",
          "chainTxHash": "0x..."
        },
        "nftsMinted": 1000,
        "status": "completed"
      },
      {
        "step": 2,
        "stage": "transfer_to_distributor",
        "timestamp": "2024-01-02T10:00:00.000Z",
        "entity": {
          "type": "distributor",
          "name": "Công ty Phân phối XYZ",
          "licenseNo": "LIC-002",
          "address": "456 Đường XYZ",
          "walletAddress": "0x..."
        },
        "details": {
          "invoiceNumber": "INV-001",
          "invoiceDate": "2024-01-02",
          "quantity": 5000,
          "nfts": [...],
          "chainTxHash": "0x...",
          "status": "paid"
        },
        "proof": {
          "receivedAt": "2024-01-03T10:00:00.000Z",
          "receivedBy": "Nguyễn Văn A",
          "verificationCode": "VER-001",
          "status": "confirmed",
          "transferTxHash": "0x..."
        }
      }
    ],
    "nfts": [
      {
        "tokenId": "1",
        "serialNumber": "SN-001",
        "status": "transferred",
        "currentOwner": {...}
      }
    ],
    "statistics": {
      "totalNFTs": 1000,
      "nftsByStatus": {
        "minted": 200,
        "transferred": 600,
        "sold": 150,
        "expired": 30,
        "recalled": 20
      },
      "distributorsInvolved": 5,
      "pharmaciesInvolved": 15,
      "transfersToDistributors": 10,
      "transfersToPharmacies": 50,
      "completedSupplyChains": 40
    },
    "entities": {
      "manufacturer": {...},
      "distributors": [...],
      "pharmacies": [...]
    }
  }
}
```

---

### 13.5. NFT Journey
**Endpoint:** `GET /api/admin/batch-tracking/nft/:tokenId/journey`  
**Path Parameters:**
- `tokenId` (required): Token ID của NFT

**Authorization:** `system_admin`  
**Mô tả:** Hành trình chi tiết của một NFT từ sản xuất đến nhà thuốc

**Response:**
```json
{
  "success": true,
  "data": {
    "nftInfo": {
      "tokenId": "1",
      "serialNumber": "SN-001",
      "status": "sold",
      "currentOwner": {
        "_id": "...",
        "username": "pharmacy_user",
        "email": "pharmacy@example.com",
        "role": "pharmacy"
      },
      "proofOfProduction": {...}
    },
    "production": {
      "batchNumber": "BATCH-001",
      "drug": {...},
      "manufacturer": {...},
      "mfgDate": "2024-01-01",
      "expDate": "2025-01-01"
    },
    "timeline": [
      {
        "step": 1,
        "stage": "production",
        "timestamp": "2024-01-01T10:00:00.000Z",
        "entity": {
          "type": "pharma_company",
          "name": "Công ty Dược phẩm ABC",
          "address": "123 Đường ABC"
        },
        "details": {
          "batchNumber": "BATCH-001",
          "tokenId": "1",
          "serialNumber": "SN-001",
          "mfgDate": "2024-01-01",
          "expDate": "2025-01-01"
        }
      },
      {
        "step": 2,
        "stage": "transfer_to_distributor",
        "timestamp": "2024-01-02T10:00:00.000Z",
        "entity": {
          "type": "distributor",
          "name": "Công ty Phân phối XYZ",
          "address": "456 Đường XYZ"
        },
        "details": {
          "invoiceNumber": "INV-001",
          "status": "paid",
          "deliveryAddress": "456 Đường XYZ"
        },
        "proof": {
          "receivedAt": "2024-01-03T10:00:00.000Z",
          "receivedBy": "Nguyễn Văn A",
          "status": "confirmed"
        }
      },
      {
        "step": 3,
        "stage": "transfer_to_pharmacy",
        "timestamp": "2024-01-05T10:00:00.000Z",
        "entity": {
          "type": "pharmacy",
          "name": "Nhà thuốc DEF",
          "address": "789 Đường DEF"
        },
        "details": {
          "invoiceNumber": "CI-001",
          "status": "paid",
          "supplyChainCompleted": true
        },
        "proof": {
          "receivedAt": "2024-01-06T10:00:00.000Z",
          "receivedBy": "Trần Thị B",
          "status": "completed",
          "supplyChainCompleted": true
        }
      }
    ],
    "statistics": {
      "totalTransfers": 2,
      "distributorsInvolved": 1,
      "pharmaciesInvolved": 1,
      "supplyChainCompleted": true
    }
  }
}
```

---

## 📝 GHI CHÚ QUAN TRỌNG

### Authentication
Tất cả các API đều yêu cầu header:
```
Authorization: Bearer <token>
```

### Error Response
Khi có lỗi, response sẽ có format:
```json
{
  "success": false,
  "message": "Thông báo lỗi",
  "error": "Chi tiết lỗi"
}
```

### Status Codes
- `200`: Thành công
- `401`: Unauthorized (chưa đăng nhập hoặc token hết hạn)
- `403`: Forbidden (không có quyền truy cập)
- `500`: Server error

### Date Format
- Format date trong query params: `YYYY-MM-DD` (ví dụ: `2024-01-15`)
- Format date trong response: ISO 8601 (ví dụ: `2024-01-15T00:00:00.000Z`)

### Role-based Data
Một số API trả về dữ liệu khác nhau tùy theo role của user:
- **Manufacturer (pharma_company):** Dữ liệu về sản xuất, chuyển giao
- **Distributor:** Dữ liệu về nhận hàng, phân phối, chuyển giao
- **Pharmacy:** Dữ liệu về nhận hàng, biên nhận, chất lượng

---

## 🎨 VÍ DỤ SỬ DỤNG (Frontend)

### JavaScript/TypeScript
```javascript
// Lấy dashboard manufacturer
const getManufacturerDashboard = async () => {
  const response = await fetch('/api/statistics/manufacturer/dashboard', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  return data;
};

// Lấy monthly trends với 6 tháng
const getMonthlyTrends = async (months = 6) => {
  const response = await fetch(`/api/statistics/trends/monthly?months=${months}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  return data;
};

// Lấy performance metrics với date range
const getPerformanceMetrics = async (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await fetch(`/api/statistics/performance?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  return data;
};
```

---

**Tài liệu này được tạo tự động từ codebase. Cập nhật: 2024**

