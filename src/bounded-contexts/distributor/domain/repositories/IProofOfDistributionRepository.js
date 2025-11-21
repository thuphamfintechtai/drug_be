export class IProofOfDistributionRepository {
  async findById(id) {
    throw new Error("Method findById() must be implemented");
  }

  async findByDistributor(distributorId, filters = {}) {
    throw new Error("Method findByDistributor() must be implemented");
  }

  async findByManufacturer(manufacturerId, filters = {}) {
    throw new Error("Method findByManufacturer() must be implemented");
  }

  async findByManufacturerInvoice(invoiceId) {
    throw new Error("Method findByManufacturerInvoice() must be implemented");
  }

  async save(proofOfDistribution) {
    throw new Error("Method save() must be implemented");
  }

  async delete(id) {
    throw new Error("Method delete() must be implemented");
  }
}

