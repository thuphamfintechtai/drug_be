import { AggregateRoot } from "../../../../shared-kernel/domain/AggregateRoot.js";

export class Session extends AggregateRoot {
  constructor(id, userId, token, expiresAt, ipAddress = null, userAgent = null) {
    super(id);
    this._userId = userId;
    this._token = token;
    this._expiresAt = expiresAt;
    this._ipAddress = ipAddress;
    this._userAgent = userAgent;
    this._createdAt = new Date();
    this._lastAccessedAt = new Date();
    this._isActive = true;
  }

  static create(id, userId, token, expiresAt, ipAddress = null, userAgent = null) {
    return new Session(id, userId, token, expiresAt, ipAddress, userAgent);
  }

  get userId() {
    return this._userId;
  }

  get token() {
    return this._token;
  }

  get expiresAt() {
    return this._expiresAt;
  }

  get ipAddress() {
    return this._ipAddress;
  }

  get userAgent() {
    return this._userAgent;
  }

  get createdAt() {
    return this._createdAt;
  }

  get lastAccessedAt() {
    return this._lastAccessedAt;
  }

  get isActive() {
    return this._isActive && !this.isExpired();
  }

  isExpired() {
    return new Date() > this._expiresAt;
  }

  refresh() {
    this._lastAccessedAt = new Date();
  }

  terminate() {
    this._isActive = false;
  }
}

