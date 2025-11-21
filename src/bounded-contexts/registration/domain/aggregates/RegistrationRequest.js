import { AggregateRoot } from "../../../../shared-kernel/domain/AggregateRoot.js";
import { RegistrationStatus, Status } from "../value-objects/RegistrationStatus.js";
import { CompanyInfo } from "../entities/CompanyInfo.js";
import { RegistrationRequestSubmitted } from "../domain-events/RegistrationRequestSubmitted.js";
import { RegistrationRequestApproved } from "../domain-events/RegistrationRequestApproved.js";
import { RegistrationRequestRejected } from "../domain-events/RegistrationRequestRejected.js";
import crypto from "crypto";

export const BusinessRole = {
  PHARMA_COMPANY: "pharma_company",
  DISTRIBUTOR: "distributor",
  PHARMACY: "pharmacy",
};

export class RegistrationRequest extends AggregateRoot {
  constructor(
    id,
    userId,
    role,
    companyInfo,
    status = Status.PENDING,
    reviewedBy = null,
    reviewedAt = null,
    rejectionReason = null,
    contractAddress = null,
    transactionHash = null,
    blockchainRetryCount = 0,
    blockchainLastAttempt = null
  ) {
    super(id);
    this._userId = userId;
    this._role = role;
    this._companyInfo = companyInfo;
    this._status = RegistrationStatus.create(status);
    this._reviewedBy = reviewedBy;
    this._reviewedAt = reviewedAt;
    this._rejectionReason = rejectionReason || "";
    this._contractAddress = contractAddress;
    this._transactionHash = transactionHash;
    this._blockchainRetryCount = blockchainRetryCount;
    this._blockchainLastAttempt = blockchainLastAttempt;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  static create(userId, role, companyInfo) {
    const id = crypto.randomUUID();
    const request = new RegistrationRequest(id, userId, role, companyInfo);

    request.raiseDomainEvent(
      new RegistrationRequestSubmitted(
        id,
        userId,
        role,
        companyInfo.licenseNo,
        companyInfo.taxCode
      )
    );

    return request;
  }

  get userId() {
    return this._userId;
  }

  get role() {
    return this._role;
  }

  get companyInfo() {
    return this._companyInfo;
  }

  get status() {
    return this._status.value;
  }

  get statusVO() {
    return this._status;
  }

  get reviewedBy() {
    return this._reviewedBy;
  }

  get reviewedAt() {
    return this._reviewedAt;
  }

  get rejectionReason() {
    return this._rejectionReason;
  }

  get contractAddress() {
    return this._contractAddress;
  }

  get transactionHash() {
    return this._transactionHash;
  }

  get blockchainRetryCount() {
    return this._blockchainRetryCount;
  }

  get blockchainLastAttempt() {
    return this._blockchainLastAttempt;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  canBeReviewed() {
    return this._status.canBeReviewed();
  }

  approve(reviewedBy) {
    if (!this.canBeReviewed()) {
      throw new Error(`Yêu cầu này đã được xử lý với trạng thái: ${this._status.value}`);
    }

    this._status = RegistrationStatus.approvedPendingBlockchain();
    this._reviewedBy = reviewedBy;
    this._reviewedAt = new Date();

    this.raiseDomainEvent(
      new RegistrationRequestApproved(this.id, this._userId, this._role, reviewedBy)
    );
  }

  reject(reviewedBy, rejectionReason = "") {
    if (!this.canBeReviewed()) {
      throw new Error(`Yêu cầu này đã được xử lý với trạng thái: ${this._status.value}`);
    }

    this._status = RegistrationStatus.rejected();
    this._reviewedBy = reviewedBy;
    this._reviewedAt = new Date();
    this._rejectionReason = rejectionReason;

    this.raiseDomainEvent(
      new RegistrationRequestRejected(
        this.id,
        this._userId,
        this._role,
        reviewedBy,
        rejectionReason
      )
    );
  }

  markBlockchainSuccess(transactionHash, contractAddress) {
    this._status = RegistrationStatus.approved();
    this._transactionHash = transactionHash;
    this._contractAddress = contractAddress;
    this._updatedAt = new Date();
  }

  markBlockchainFailed() {
    this._status = RegistrationStatus.blockchainFailed();
    this._blockchainRetryCount += 1;
    this._blockchainLastAttempt = new Date();
    this._updatedAt = new Date();
  }
}

