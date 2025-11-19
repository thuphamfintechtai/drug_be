export class ICommercialInvoiceRepository {
  async findById(id) {
    throw new Error("Method findById() must be implemented");
  }

  async findByInvoiceNumber(invoiceNumber) {
    throw new Error("Method findByInvoiceNumber() must be implemented");
  }

  async findByDistributor(distributorId, filters = {}) {
    throw new Error("Method findByDistributor() must be implemented");
  }

  async findByPharmacy(pharmacyId, filters = {}) {
    throw new Error("Method findByPharmacy() must be implemented");
  }

  async save(invoice) {
    throw new Error("Method save() must be implemented");
  }

  async delete(id) {
    throw new Error("Method delete() must be implemented");
  }
}

