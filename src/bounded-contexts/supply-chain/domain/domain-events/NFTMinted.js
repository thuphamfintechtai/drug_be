import { DomainEvent } from "../../../../shared-kernel/domain/DomainEvent.js";

export class NFTMinted extends DomainEvent {
  constructor(nftId, tokenId, drugId, batchNumber, quantity, transactionHash) {
    super();
    this.nftId = nftId;
    this.tokenId = tokenId;
    this.drugId = drugId;
    this.batchNumber = batchNumber;
    this.quantity = quantity;
    this.transactionHash = transactionHash;
  }
}

