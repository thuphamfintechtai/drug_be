import { AggregateRoot } from "../../../../shared-kernel/domain/AggregateRoot.js";
import { Email } from "../value-objects/Email.js";
import { PasswordHash } from "../value-objects/Password.js";
import { Role } from "../value-objects/Role.js";
import { UserStatus } from "../value-objects/UserStatus.js";
import { UserRegistered } from "../domain-events/UserRegistered.js";
import { UserLoggedIn } from "../domain-events/UserLoggedIn.js";
import { PasswordResetRequested } from "../domain-events/PasswordResetRequested.js";

export class User extends AggregateRoot {
  constructor(
    id,
    username,
    email,
    passwordHash,
    role,
    status,
    fullName = null,
    phone = null,
    country = null,
    address = null,
    walletAddress = null,
    avatar = null,
    pharmaCompanyId = null,
    distributorId = null,
    pharmacyId = null,
    isAdmin = false
  ) {
    super(id);
    this._username = username;
    this._email = Email.create(email);
    this._passwordHash = PasswordHash.create(passwordHash);
    this._role = Role.create(role);
    this._status = UserStatus.create(status);
    this._fullName = fullName || "";
    this._phone = phone || "";
    this._country = country || "";
    this._address = address || "";
    this._walletAddress = walletAddress;
    this._avatar = avatar;
    this._pharmaCompanyId = pharmaCompanyId;
    this._distributorId = distributorId;
    this._pharmacyId = pharmacyId;
    this._isAdmin = isAdmin;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  static create(
    id,
    username,
    email,
    passwordHash,
    role,
    fullName = null,
    phone = null,
    country = null,
    address = null
  ) {
    const status = role === Role.systemAdmin().value || role === Role.user().value
      ? UserStatus.active()
      : UserStatus.pending();

    const user = new User(
      id,
      username,
      email,
      passwordHash,
      role,
      status.value,
      fullName,
      phone,
      country,
      address
    );

    user.raiseDomainEvent(
      new UserRegistered(
        id,
        email,
        role,
        username
      )
    );

    return user;
  }

  get username() {
    return this._username;
  }

  get email() {
    return this._email.value;
  }

  get emailVO() {
    return this._email;
  }

  get passwordHash() {
    return this._passwordHash.hash;
  }

  get role() {
    return this._role.value;
  }

  get roleVO() {
    return this._role;
  }

  get status() {
    return this._status.value;
  }

  get statusVO() {
    return this._status;
  }

  get fullName() {
    return this._fullName;
  }

  get phone() {
    return this._phone;
  }

  get country() {
    return this._country;
  }

  get address() {
    return this._address;
  }

  get walletAddress() {
    return this._walletAddress;
  }

  get avatar() {
    return this._avatar;
  }

  get pharmaCompanyId() {
    return this._pharmaCompanyId;
  }

  get distributorId() {
    return this._distributorId;
  }

  get pharmacyId() {
    return this._pharmacyId;
  }

  get isAdmin() {
    return this._isAdmin || this._role.isAdmin();
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  canLogin() {
    return this._status.canLogin();
  }

  activate() {
    this._status = UserStatus.active();
    this._updatedAt = new Date();
  }

  deactivate() {
    this._status = UserStatus.inactive();
    this._updatedAt = new Date();
  }

  ban() {
    this._status = UserStatus.banned();
    this._updatedAt = new Date();
  }

  updateProfile(fullName, phone, country, address) {
    if (fullName !== undefined) this._fullName = fullName;
    if (phone !== undefined) this._phone = phone;
    if (country !== undefined) this._country = country;
    if (address !== undefined) this._address = address;
    this._updatedAt = new Date();
  }

  updatePassword(newPasswordHash) {
    this._passwordHash = PasswordHash.create(newPasswordHash);
    this._updatedAt = new Date();
  }

  setWalletAddress(walletAddress) {
    this._walletAddress = walletAddress;
    this._updatedAt = new Date();
  }

  linkBusinessEntity(role, businessEntityId) {
    if (role === Role.pharmaCompany().value) {
      this._pharmaCompanyId = businessEntityId;
    } else if (role === Role.distributor().value) {
      this._distributorId = businessEntityId;
    } else if (role === Role.pharmacy().value) {
      this._pharmacyId = businessEntityId;
    }
    this._updatedAt = new Date();
  }

  recordLogin(ipAddress) {
    this.raiseDomainEvent(
      new UserLoggedIn(
        this.id,
        this.email,
        this.role,
        ipAddress
      )
    );
  }

  requestPasswordReset(token) {
    this.raiseDomainEvent(
      new PasswordResetRequested(
        this.id,
        this.email,
        token
      )
    );
  }

  changeStatus(status) {
    // UserStatus already imported at top of file
    this._status = UserStatus.create(status);
    this._updatedAt = new Date();
  }
}

