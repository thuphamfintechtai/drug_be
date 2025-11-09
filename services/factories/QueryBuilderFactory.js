export class QueryBuilderFactory {
  static createManufacturerInvoiceFilter(user, options = {}) {
    const filter = {};

    if (user.role === "pharma_company") {
      filter.fromManufacturer = user._id;
    } else if (user.role === "distributor") {
      filter.toDistributor = user._id;
    }

    // Thêm các filter tùy chọn
    if (options.status) {
      filter.status = options.status;
    }

    if (options.search) {
      filter.$or = [
        { invoiceNumber: { $regex: options.search, $options: "i" } },
        { notes: { $regex: options.search, $options: "i" } },
      ];
    }

    return filter;
  }


  static createCommercialInvoiceFilter(user, options = {}) {
    const filter = {};

    // Filter dựa trên role
    if (user.role === "distributor") {
      filter.fromDistributor = user._id;
    } else if (user.role === "pharmacy") {
      filter.toPharmacy = user._id;
    }

    // Thêm các filter tùy chọn
    if (options.status) {
      filter.status = options.status;
    }

    if (options.search) {
      filter.$or = [
        { invoiceNumber: { $regex: options.search, $options: "i" } },
      ];
    }

    return filter;
  }


  static createProofOfDistributionFilter(user, options = {}) {
    const filter = {};

    // Filter dựa trên role
    if (user.role === "pharma_company") {
      filter.fromManufacturer = user._id;
    } else if (user.role === "distributor") {
      filter.toDistributor = user._id;
    }

    // Thêm các filter tùy chọn
    if (options.status) {
      filter.status = options.status;
    }

    if (options.search) {
      filter.$or = [
        { notes: { $regex: options.search, $options: "i" } },
      ];
    }

    return filter;
  }

  /**
   * Tạo filter cho ProofOfPharmacy dựa trên role
   * @param {Object} user - User object
   * @param {Object} options - Query options
   * @returns {Object} MongoDB filter object
   */
  static createProofOfPharmacyFilter(user, options = {}) {
    const filter = {};

    // Filter dựa trên role
    if (user.role === "distributor") {
      filter.fromDistributor = user._id;
    } else if (user.role === "pharmacy") {
      filter.toPharmacy = user._id;
    }

    // Thêm các filter tùy chọn
    if (options.status) {
      filter.status = options.status;
    }

    return filter;
  }

  /**
   * Tạo filter cho DrugInfo dựa trên role
   * @param {Object} user - User object
   * @param {Object} options - Query options
   * @returns {Object} MongoDB filter object
   */
  static createDrugInfoFilter(user, options = {}) {
    const filter = {};

    // Filter dựa trên role
    if (user.role === "pharma_company") {
      // Pharma company chỉ thấy thuốc của mình
      // Cần populate manufacturer để filter
      // Logic này sẽ được xử lý trong controller với populate
    }

    // Thêm các filter tùy chọn
    if (options.status) {
      filter.status = options.status || "active";
    }

    if (options.search) {
      filter.$or = [
        { tradeName: { $regex: options.search, $options: "i" } },
        { genericName: { $regex: options.search, $options: "i" } },
        { atcCode: { $regex: options.search, $options: "i" } },
      ];
    }

    return filter;
  }

  /**
   * Tạo pagination options
   * @param {Object} query - Express query object
   * @returns {Object} Pagination options (page, limit, skip)
   */
  static createPaginationOptions(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    return {
      page,
      limit,
      skip,
    };
  }

  static createSearchFilter(search, fields) {
    if (!search || !fields || fields.length === 0) {
      return {};
    }
    return {
      $or: fields.map(field => ({
        [field]: { $regex: search, $options: "i" }
      }))
    };
  }


  static createUserFilter(options = {}) {
    const filter = {};
    if (options.role) {
      filter.role = options.role;
    }
    if (options.status) {
      filter.status = options.status;
    }
    if (options.search) {
      filter.$or = [
        { username: { $regex: options.search, $options: "i" } },
        { email: { $regex: options.search, $options: "i" } },
        { fullName: { $regex: options.search, $options: "i" } },
      ];
    }
    return filter;
  }


  static createDrugSearchFilter(options = {}) {
    const filter = {};
    
    if (options.status) {
      filter.status = options.status;
    } else if (!options.manufacturerId) {
      // Default to active nếu không có manufacturerId (public search)
      filter.status = "active";
    }
    
    if (options.manufacturerId) {
      filter.manufacturer = options.manufacturerId;
    }
    
    if (options.atcCode) {
      filter.atcCode = { $regex: options.atcCode, $options: "i" };
    }
    
    if (options.search) {
      filter.$or = [
        { tradeName: { $regex: options.search, $options: "i" } },
        { genericName: { $regex: options.search, $options: "i" } },
        { atcCode: { $regex: options.search, $options: "i" } },
      ];
    }
    
    return filter;
  }

  static createPharmacySearchFilter(options = {}) {
    const filter = {};
    
    if (options.status) {
      filter.status = options.status;
    } else {
      filter.status = "active";
    }
    
    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: "i" } },
        { licenseNo: { $regex: options.search, $options: "i" } },
        { taxCode: { $regex: options.search, $options: "i" } },
      ];
    }
    
    return filter;
  }

  static createDistributorSearchFilter(options = {}) {
    const filter = {};
    
    if (options.status) {
      filter.status = options.status;
    } else {
      filter.status = "active";
    }
    
    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: "i" } },
        { licenseNo: { $regex: options.search, $options: "i" } },
        { taxCode: { $regex: options.search, $options: "i" } },
      ];
    }
    
    return filter;
  }
}

export default QueryBuilderFactory;

