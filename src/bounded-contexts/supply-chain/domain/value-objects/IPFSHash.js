import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export class IPFSHash extends ValueObject {
  constructor(hash, url = null) {
    super();
    if (!hash || typeof hash !== "string" || hash.trim().length === 0) {
      throw new Error("IPFSHash không được để trống");
    }
    this._hash = hash.trim();
    this._url = url || `https://gateway.pinata.cloud/ipfs/${this._hash}`;
  }

  get hash() {
    return this._hash;
  }

  get url() {
    return this._url;
  }

  equals(other) {
    if (!(other instanceof IPFSHash)) {
      return false;
    }
    return this._hash === other._hash;
  }

  static create(hash, url = null) {
    return new IPFSHash(hash, url);
  }
}

