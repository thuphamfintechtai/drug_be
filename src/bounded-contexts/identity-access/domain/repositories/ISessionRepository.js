export class ISessionRepository {
  async findById(id) {
    throw new Error("findById method must be implemented");
  }

  async findByToken(token) {
    throw new Error("findByToken method must be implemented");
  }

  async findByUserId(userId) {
    throw new Error("findByUserId method must be implemented");
  }

  async save(session) {
    throw new Error("save method must be implemented");
  }

  async delete(id) {
    throw new Error("delete method must be implemented");
  }

  async deleteByUserId(userId) {
    throw new Error("deleteByUserId method must be implemented");
  }
}

