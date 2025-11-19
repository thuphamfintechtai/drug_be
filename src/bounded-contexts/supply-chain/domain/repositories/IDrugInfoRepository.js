export class IDrugInfoRepository {
  async findById(id) {
    throw new Error("findById method must be implemented");
  }

  async findByATCCode(atcCode) {
    throw new Error("findByATCCode method must be implemented");
  }

  async findByManufacturer(manufacturerId) {
    throw new Error("findByManufacturer method must be implemented");
  }

  async save(drugInfo) {
    throw new Error("save method must be implemented");
  }

  async delete(id) {
    throw new Error("delete method must be implemented");
  }

  async findAll(filters = {}) {
    throw new Error("findAll method must be implemented");
  }
}

