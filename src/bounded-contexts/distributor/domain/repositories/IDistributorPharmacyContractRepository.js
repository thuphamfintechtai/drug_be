export class IDistributorPharmacyContractRepository {
  async save(contract) {
    throw new Error("save method must be implemented");
  }

  async findById(contractId) {
    throw new Error("findById method must be implemented");
  }

  async findByDistributorAndPharmacy(distributorId, pharmacyId) {
    throw new Error("findByDistributorAndPharmacy method must be implemented");
  }

  async findByDistributor(distributorId, filters = {}) {
    throw new Error("findByDistributor method must be implemented");
  }

  async findByPharmacy(pharmacyId, filters = {}) {
    throw new Error("findByPharmacy method must be implemented");
  }

  async delete(contractId) {
    throw new Error("delete method must be implemented");
  }
}

