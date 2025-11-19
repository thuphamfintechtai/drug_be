import { AggregateRoot } from "../../../../shared-kernel/domain/AggregateRoot.js";
import { TokenId } from "../value-objects/TokenId.js";
import { BatchNumber } from "../value-objects/BatchNumber.js";
import { IPFSHash } from "../value-objects/IPFSHash.js";
import { NFTMinted } from "../domain-events/NFTMinted.js";
import crypto from "crypto";

export const NFTStatus = {
  MINTED: "minted",
  TRANSFERRED: "transferred",
  SOLD: "sold",
  EXPIRED: "expired",
  RECALLED: "recalled",
};

export class NFT extends AggregateRoot {
  constructor(
    id,
    tokenId,
    drugId,
    manufacturerId,
    batchNumber,
    serialNumber,
    quantity = 1,
    mfgDate = null,
    expDate = null,
    ownerId = null,
    chainTxHash = null,
    ipfsHash = null,
    metadata = null,
    proofOfProductionId = null,
    status = NFTStatus.MINTED
  ) {
    super(id);
    this._tokenId = tokenId instanceof TokenId ? tokenId : TokenId.create(tokenId);
    this._drugId = drugId;
    this._manufacturerId = manufacturerId;
    this._batchNumber = batchNumber instanceof BatchNumber ? batchNumber : BatchNumber.create(batchNumber || "");
    this._serialNumber = serialNumber;
    this._quantity = quantity;
    this._mfgDate = mfgDate || new Date();
    this._expDate = expDate;
    this._ownerId = ownerId || manufacturerId; // Owner initially is manufacturer
    this._chainTxHash = chainTxHash;
    if (ipfsHash) {
      this._ipfsHash = ipfsHash instanceof IPFSHash 
        ? ipfsHash 
        : IPFSHash.create(
            typeof ipfsHash === 'string' ? (ipfsHash.includes("/") ? ipfsHash.split("/").pop() : ipfsHash) : (ipfsHash.hash || ipfsHash), 
            typeof ipfsHash === 'string' && ipfsHash.startsWith("http") ? ipfsHash : (ipfsHash?.url || null)
          );
    } else {
      this._ipfsHash = null;
    }
    this._metadata = metadata || {};
    this._proofOfProductionId = proofOfProductionId;
    this._status = status;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  static create(
    tokenId,
    drugId,
    manufacturerId,
    batchNumber,
    serialNumber,
    quantity = 1,
    mfgDate = null,
    expDate = null,
    ipfsHash = null,
    metadata = null,
    proofOfProductionId = null
  ) {
    const id = crypto.randomUUID();
    const nft = new NFT(
      id,
      tokenId,
      drugId,
      manufacturerId,
      batchNumber,
      serialNumber,
      quantity,
      mfgDate,
      expDate,
      manufacturerId, // Owner initially is manufacturer
      null, // chainTxHash will be set after minting
      ipfsHash,
      metadata,
      proofOfProductionId,
      NFTStatus.MINTED
    );

    // Emit domain event
    nft.addDomainEvent(
      new NFTMinted(
        nft.id,
        nft.tokenId.value,
        nft.drugId,
        nft.manufacturerId,
        nft.batchNumber.value,
        nft.quantity
      )
    );

    return nft;
  }

  get tokenId() {
    return this._tokenId.value;
  }

  get tokenIdVO() {
    return this._tokenId;
  }

  get drugId() {
    return this._drugId;
  }

  get manufacturerId() {
    return this._manufacturerId;
  }

  get batchNumber() {
    return this._batchNumber.value;
  }

  get batchNumberVO() {
    return this._batchNumber;
  }

  get serialNumber() {
    return this._serialNumber;
  }

  get quantity() {
    return this._quantity;
  }

  get mfgDate() {
    return this._mfgDate;
  }

  get expDate() {
    return this._expDate;
  }

  get ownerId() {
    return this._ownerId;
  }

  get chainTxHash() {
    return this._chainTxHash;
  }

  get ipfsHash() {
    return this._ipfsHash ? this._ipfsHash.hash : null;
  }

  get ipfsUrl() {
    return this._ipfsHash ? this._ipfsHash.url : null;
  }

  get ipfsHashVO() {
    return this._ipfsHash;
  }

  get metadata() {
    return this._metadata ? { ...this._metadata } : null;
  }

  get proofOfProductionId() {
    return this._proofOfProductionId;
  }

  get status() {
    return this._status;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  setMintTransaction(chainTxHash) {
    this._chainTxHash = chainTxHash;
    this._updatedAt = new Date();
  }

  transfer(newOwnerId, chainTxHash = null) {
    if (this._status === NFTStatus.SOLD) {
      throw new Error("NFT đã được bán, không thể chuyển giao");
    }

    if (this._status === NFTStatus.EXPIRED) {
      throw new Error("NFT đã hết hạn, không thể chuyển giao");
    }

    if (this._status === NFTStatus.RECALLED) {
      throw new Error("NFT đã bị thu hồi, không thể chuyển giao");
    }

    this._ownerId = newOwnerId;
    this._status = NFTStatus.TRANSFERRED;
    if (chainTxHash) {
      this._chainTxHash = chainTxHash;
    }
    this._updatedAt = new Date();
  }

  sell(chainTxHash = null) {
    if (this._status !== NFTStatus.TRANSFERRED) {
      throw new Error("Chỉ có thể bán NFT đã được chuyển giao");
    }

    this._status = NFTStatus.SOLD;
    if (chainTxHash) {
      this._chainTxHash = chainTxHash;
    }
    this._updatedAt = new Date();
  }

  markAsExpired() {
    this._status = NFTStatus.EXPIRED;
    this._updatedAt = new Date();
  }

  recall() {
    this._status = NFTStatus.RECALLED;
    this._updatedAt = new Date();
  }

  isExpired() {
    if (!this._expDate) {
      return false;
    }
    return new Date() > this._expDate;
  }

  canBeTransferred() {
    return (
      this._status === NFTStatus.MINTED || 
      this._status === NFTStatus.TRANSFERRED
    ) && !this.isExpired();
  }
}

