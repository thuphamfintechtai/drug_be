import { UserResponseDTO } from "../dto/UserResponseDTO.js";
import { UserNotFoundException } from "../../domain/exceptions/UserNotFoundException.js";

export class UserManagementApplicationService {
  constructor(userRepository, businessEntityService = null) {
    this._userRepository = userRepository;
    this._businessEntityService = businessEntityService;
  }

  async getCurrentUser(userId) {
    const user = await this._userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    const userDTO = UserResponseDTO.fromUser(user);
    
    // Get business profile if applicable
    let businessProfile = null;
    if (this._businessEntityService) {
      businessProfile = await this._businessEntityService.getBusinessProfile(user);
    }

    return {
      user: userDTO,
      businessProfile,
    };
  }

  async getUserById(id) {
    const user = await this._userRepository.findById(id);

    if (!user) {
      throw new UserNotFoundException();
    }

    return UserResponseDTO.fromUser(user);
  }

  async updateUserProfile(userId, fullName, phone, country, address) {
    const user = await this._userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    user.updateProfile(fullName, phone, country, address);
    await this._userRepository.save(user);

    return UserResponseDTO.fromUser(user);
  }

  async getAllUsers(filters = {}) {
    const { role, status, search } = filters;
    
    // Build query
    let query = {};
    if (role) {
      query.role = role;
    }
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await this._userRepository.findAll(query, { skip, limit });
    const total = await this._userRepository.count(query);

    return {
      users: users.map(user => UserResponseDTO.fromUser(user).toJSON()),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserStats() {
    const total = await this._userRepository.count();
    const byRole = {
      user: await this._userRepository.countByRole("user"),
      system_admin: await this._userRepository.countByRole("system_admin"),
      pharma_company: await this._userRepository.countByRole("pharma_company"),
      distributor: await this._userRepository.countByRole("distributor"),
      pharmacy: await this._userRepository.countByRole("pharmacy"),
    };
    const byStatus = {
      active: await this._userRepository.countByStatus("active"),
      inactive: await this._userRepository.countByStatus("inactive"),
      banned: await this._userRepository.countByStatus("banned"),
      pending: await this._userRepository.countByStatus("pending"),
    };

    return {
      total,
      byRole,
      byStatus,
    };
  }

  async updateUser(userId, updateData) {
    const user = await this._userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    if (updateData.fullName !== undefined) {
      user.updateProfile(updateData.fullName, user.phone, user.country, user.address);
    }
    if (updateData.phone !== undefined) {
      user.updateProfile(user.fullName, updateData.phone, user.country, user.address);
    }
    if (updateData.country !== undefined) {
      user.updateProfile(user.fullName, user.phone, updateData.country, user.address);
    }
    if (updateData.address !== undefined) {
      user.updateProfile(user.fullName, user.phone, user.country, updateData.address);
    }

    await this._userRepository.save(user);

    return UserResponseDTO.fromUser(user);
  }

  async updateUserStatus(userId, status) {
    const validStatuses = ["active", "inactive", "banned", "pending"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Status không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}`);
    }

    const user = await this._userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    user.changeStatus(status);
    await this._userRepository.save(user);

    return UserResponseDTO.fromUser(user);
  }

  async deleteUser(userId) {
    const user = await this._userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    await this._userRepository.delete(userId);
    return true;
  }

  async changePassword(userId, oldPassword, newPassword) {
    if (!oldPassword || !newPassword) {
      throw new Error("Vui lòng cung cấp oldPassword và newPassword");
    }

    if (newPassword.length < 6) {
      throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
    }

    const user = await this._userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    // Verify old password
    const PasswordHasher = (await import("../../infrastructure/security/PasswordHasher.js")).PasswordHasher;
    const passwordHasher = new PasswordHasher();
    const isPasswordValid = await passwordHasher.compare(oldPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error("Mật khẩu cũ không đúng");
    }

    // Update password
    const newPasswordHash = await passwordHasher.hash(newPassword);
    user.updatePassword(newPasswordHash);
    await this._userRepository.save(user);

    return { success: true };
  }
}

