export class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.fullName = user.fullName;
    this.phone = user.phone;
    this.country = user.country;
    this.address = user.address;
    this.role = user.role;
    this.status = user.status;
    this.walletAddress = user.walletAddress;
    this.avatar = user.avatar;
    this.isAdmin = user.isAdmin;
    this.pharmaCompanyId = user.pharmaCompanyId;
    this.distributorId = user.distributorId;
    this.pharmacyId = user.pharmacyId;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  static fromUser(user) {
    return new UserResponseDTO(user);
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      fullName: this.fullName,
      phone: this.phone,
      country: this.country,
      address: this.address,
      role: this.role,
      status: this.status,
      walletAddress: this.walletAddress,
      avatar: this.avatar,
      isAdmin: this.isAdmin,
      pharmaCompanyId: this.pharmaCompanyId,
      distributorId: this.distributorId,
      pharmacyId: this.pharmacyId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

