export class UserController {
  constructor(userManagementApplicationService) {
    this._userService = userManagementApplicationService;
  }

  async getCurrentUser(req, res) {
    try {
      const userId = req.user?.id || req.user?._id?.toString();
      const result = await this._userService.getCurrentUser(userId);

      return res.status(200).json({
        success: true,
        data: {
          user: result.user ? result.user.toJSON() : result.user,
          businessProfile: result.businessProfile || null,
        },
      });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin người dùng",
        error: error.message,
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user?.id || req.user?._id?.toString();
      const { fullName, phone, country, address } = req.body;

      const user = await this._userService.updateUserProfile(
        userId,
        fullName,
        phone,
        country,
        address
      );

      return res.status(200).json({
        success: true,
        message: "Cập nhật thông tin thành công",
        data: user.toJSON(),
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật thông tin",
        error: error.message,
      });
    }
  }

  async getAllUsers(req, res) {
    try {
      const filters = {
        role: req.query.role,
        status: req.query.status,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit,
      };

      const result = await this._userService.getAllUsers(filters);

      return res.status(200).json({
        success: true,
        data: {
          users: result.users,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        },
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách người dùng",
        error: error.message,
      });
    }
  }

  async getUserStats(req, res) {
    try {
      const stats = await this._userService.getUserStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê người dùng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê người dùng",
        error: error.message,
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await this._userService.getUserById(id);

      return res.status(200).json({
        success: true,
        data: user.toJSON(),
      });
    } catch (error) {
      if (error.message && error.message.includes("không tìm thấy")) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      console.error("Lỗi khi lấy thông tin người dùng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin người dùng",
        error: error.message,
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { fullName, phone, country, address, status, avatar } = req.body;

      const updateData = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;
      if (country !== undefined) updateData.country = country;
      if (address !== undefined) updateData.address = address;
      if (avatar !== undefined) updateData.avatar = avatar;

      const user = await this._userService.updateUser(id, updateData);

      return res.status(200).json({
        success: true,
        message: "Cập nhật thông tin người dùng thành công",
        data: user.toJSON(),
      });
    } catch (error) {
      if (error.message && error.message.includes("không tìm thấy")) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      console.error("Lỗi khi cập nhật người dùng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật người dùng",
        error: error.message,
      });
    }
  }

  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const currentUserId = req.user?.id || req.user?._id?.toString();

      // Prevent users from changing their own status
      if (currentUserId === id && status !== "active") {
        return res.status(400).json({
          success: false,
          message: "Bạn không thể thay đổi trạng thái của chính mình",
        });
      }

      const user = await this._userService.updateUserStatus(id, status);

      return res.status(200).json({
        success: true,
        message: `Cập nhật trạng thái người dùng thành ${status} thành công`,
        data: user.toJSON(),
      });
    } catch (error) {
      if (error.message && error.message.includes("không tìm thấy")) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      if (error.message && error.message.includes("không hợp lệ")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi cập nhật trạng thái:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật trạng thái",
        error: error.message,
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id || req.user?._id?.toString();

      // Prevent users from deleting themselves
      if (currentUserId === id) {
        return res.status(400).json({
          success: false,
          message: "Bạn không thể xóa chính tài khoản của mình",
        });
      }

      await this._userService.deleteUser(id);

      return res.status(200).json({
        success: true,
        message: "Xóa người dùng thành công",
      });
    } catch (error) {
      if (error.message && error.message.includes("không tìm thấy")) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      console.error("Lỗi khi xóa người dùng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa người dùng",
        error: error.message,
      });
    }
  }

  async changePassword(req, res) {
    try {
      const userId = req.user?.id || req.user?._id?.toString();
      const { oldPassword, newPassword } = req.body;

      await this._userService.changePassword(userId, oldPassword, newPassword);

      return res.status(200).json({
        success: true,
        message: "Đổi mật khẩu thành công",
      });
    } catch (error) {
      if (
        error.message &&
        (error.message.includes("Mật khẩu cũ không đúng") ||
          error.message.includes("bắt buộc") ||
          error.message.includes("ít nhất"))
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi đổi mật khẩu:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi đổi mật khẩu",
        error: error.message,
      });
    }
  }
}

