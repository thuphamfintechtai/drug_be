export class IRegistrationRequestRepository {
  async findById(id) {
    throw new Error("findById method must be implemented");
  }

  async findByUserId(userId) {
    throw new Error("findByUserId method must be implemented");
  }

  async findByStatus(status) {
    throw new Error("findByStatus method must be implemented");
  }

  async findByRole(role) {
    throw new Error("findByRole method must be implemented");
  }

  async findByLicenseNoOrTaxCode(licenseNo, taxCode) {
    throw new Error("findByLicenseNoOrTaxCode method must be implemented");
  }

  async save(registrationRequest) {
    throw new Error("save method must be implemented");
  }

  async delete(id) {
    throw new Error("delete method must be implemented");
  }

  async count() {
    throw new Error("count method must be implemented");
  }

  async countByStatus(status) {
    throw new Error("countByStatus method must be implemented");
  }

  async countByRole(role) {
    throw new Error("countByRole method must be implemented");
  }

  async countSinceDate(date) {
    throw new Error("countSinceDate method must be implemented");
  }

  async findAll(filters = {}) {
    throw new Error("findAll method must be implemented");
  }

  async findWithUserDetails(id) {
    throw new Error("findWithUserDetails method must be implemented");
  }
}

