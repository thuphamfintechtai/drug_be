export class IDrugRepository {
  async findById(id) {
    throw new Error("findById method must be implemented");
  }

  async findByATCCode(atcCode) {
    throw new Error("findByATCCode method must be implemented");
  }

  async findByManufacturer(manufacturerId) {
    throw new Error("findByManufacturer method must be implemented");
  }

  async save(drug) {
    throw new Error("save method must be implemented");
  }

  async delete(id) {
    throw new Error("delete method must be implemented");
  }
}

