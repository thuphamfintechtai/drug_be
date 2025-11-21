import { AggregateRoot } from "../../../../shared-kernel/domain/AggregateRoot.js";
import crypto from "crypto";

export const ContractStatus = {
  NOT_CREATED: "not_created",
  PENDING: "pending",
  APPROVED: "approved",
  SIGNED: "signed",
  REJECTED: "rejected",
};

export class DistributorPharmacyContract extends AggregateRoot {
  constructor(
    id,
    distributorId,
    pharmacyId,
    contractFileUrl = null,
    contractFileName = null,
    status = ContractStatus.PENDING,
    distributorWalletAddress = null,
    pharmacyWalletAddress = null,
    blockchainTxHash = null,
    blockchainStatus = null,
    tokenId = null,
    createdAt = null,
    updatedAt = null,
    distributorSignedAt = null,
    pharmacySignedAt = null
  ) {
    super(id);
    this._distributorId = distributorId;
    this._pharmacyId = pharmacyId;
    this._contractFileUrl = contractFileUrl;
    this._contractFileName = contractFileName;
    this._status = status;
    this._distributorWalletAddress = distributorWalletAddress;
    this._pharmacyWalletAddress = pharmacyWalletAddress;
    this._blockchainTxHash = blockchainTxHash;
    this._blockchainStatus = blockchainStatus;
    this._tokenId = tokenId;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
    this._distributorSignedAt = distributorSignedAt;
    this._pharmacySignedAt = pharmacySignedAt;
  }

  static create(distributorId, pharmacyId, contractFileUrl, contractFileName, distributorWalletAddress, pharmacyWalletAddress) {
    const id = crypto.randomUUID();
    const contract = new DistributorPharmacyContract(
      id,
      distributorId,
      pharmacyId,
      contractFileUrl,
      contractFileName,
      ContractStatus.PENDING,
      distributorWalletAddress,
      pharmacyWalletAddress,
      null,
      null,
      null,
      new Date(),
      new Date(),
      null,
      null
    );

    return contract;
  }

  get distributorId() {
    return this._distributorId;
  }

  get pharmacyId() {
    return this._pharmacyId;
  }

  get contractFileUrl() {
    return this._contractFileUrl;
  }

  get contractFileName() {
    return this._contractFileName;
  }

  get status() {
    return this._status;
  }

  get distributorWalletAddress() {
    return this._distributorWalletAddress;
  }

  get pharmacyWalletAddress() {
    return this._pharmacyWalletAddress;
  }

  get blockchainTxHash() {
    return this._blockchainTxHash;
  }

  get blockchainStatus() {
    return this._blockchainStatus;
  }

  get tokenId() {
    return this._tokenId;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  get distributorSignedAt() {
    return this._distributorSignedAt;
  }

  get pharmacySignedAt() {
    return this._pharmacySignedAt;
  }

  setBlockchainTxHash(txHash) {
    this._blockchainTxHash = txHash;
    this._updatedAt = new Date();
  }

  setBlockchainStatus(status) {
    this._blockchainStatus = status;
    this._updatedAt = new Date();
  }

  approveByPharmacy() {
    if (this._status !== ContractStatus.PENDING) {
      throw new Error(`Không thể approve contract với trạng thái ${this._status}`);
    }
    this._status = ContractStatus.APPROVED;
    this._pharmacySignedAt = new Date();
    this._updatedAt = new Date();
  }

  finalizeByDistributor(tokenId, txHash) {
    if (this._status !== ContractStatus.APPROVED) {
      throw new Error(`Không thể finalize contract với trạng thái ${this._status}. Phải là APPROVED`);
    }
    this._status = ContractStatus.SIGNED;
    this._tokenId = tokenId;
    this._blockchainTxHash = txHash;
    this._distributorSignedAt = new Date();
    this._updatedAt = new Date();
  }

  reject() {
    if (this._status === ContractStatus.SIGNED) {
      throw new Error("Không thể reject contract đã được ký");
    }
    this._status = ContractStatus.REJECTED;
    this._updatedAt = new Date();
  }
}

