/**
 * Repository interface for Password Reset operations
 */
export class IPasswordResetRepository {
  async findById(id) {
    throw new Error("Method findById() must be implemented");
  }

  async findByToken(token) {
    throw new Error("Method findByToken() must be implemented");
  }

  async findByUserId(userId, filters = {}) {
    throw new Error("Method findByUserId() must be implemented");
  }

  async findAll(filters = {}) {
    throw new Error("Method findAll() must be implemented");
  }

  async create(data) {
    throw new Error("Method create() must be implemented");
  }

  async save(passwordReset) {
    throw new Error("Method save() must be implemented");
  }

  async delete(id) {
    throw new Error("Method delete() must be implemented");
  }

  async deletePendingByUserId(userId) {
    throw new Error("Method deletePendingByUserId() must be implemented");
  }

  async count(filters = {}) {
    throw new Error("Method count() must be implemented");
  }
}

