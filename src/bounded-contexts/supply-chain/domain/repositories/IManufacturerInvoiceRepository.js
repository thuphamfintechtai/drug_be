export class IManufacturerInvoiceRepository {
  async findById(id) {
    throw new Error("Method findById() must be implemented");
  }

  async findByInvoiceNumber(invoiceNumber) {
    throw new Error("Method findByInvoiceNumber() must be implemented");
  }

  async findByManufacturer(manufacturerId, filters = {}) {
    throw new Error("Method findByManufacturer() must be implemented");
  }

  async findByDistributor(distributorId, filters = {}) {
    throw new Error("Method findByDistributor() must be implemented");
  }

  async findByDrug(drugId) {
    throw new Error("Method findByDrug() must be implemented");
  }

  async save(invoice) {
    throw new Error("Method save() must be implemented");
  }

  async delete(id) {
    throw new Error("Method delete() must be implemented");
  }
}

