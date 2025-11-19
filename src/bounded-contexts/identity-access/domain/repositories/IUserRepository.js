export class IUserRepository {
  async findById(id) {
    throw new Error("findById method must be implemented");
  }

  async findByEmail(email) {
    throw new Error("findByEmail method must be implemented");
  }

  async findByUsername(username) {
    throw new Error("findByUsername method must be implemented");
  }

  async findByEmailOrUsername(email, username) {
    throw new Error("findByEmailOrUsername method must be implemented");
  }

  async save(user) {
    throw new Error("save method must be implemented");
  }

  async delete(id) {
    throw new Error("delete method must be implemented");
  }

  async count() {
    throw new Error("count method must be implemented");
  }

  async countByRole(role) {
    throw new Error("countByRole method must be implemented");
  }

  async countByStatus(status) {
    throw new Error("countByStatus method must be implemented");
  }

  async findAll(query = {}, options = {}) {
    throw new Error("findAll method must be implemented");
  }

  async count(query = {}) {
    throw new Error("count method with query must be implemented");
  }
}

