import { ManufacturerInvoice } from "../../../../domain/aggregates/ManufacturerInvoice.js";
import { InvoiceNumber } from "../../../../domain/value-objects/InvoiceNumber.js";
import { Quantity } from "../../../../domain/value-objects/Quantity.js";
import { Price } from "../../../../domain/value-objects/Price.js";
import { TransactionHash } from "../../../../domain/value-objects/TransactionHash.js";
import { InvoiceStatus } from "../../../../domain/aggregates/ManufacturerInvoice.js";
import mongoose from "mongoose";

export class ManufacturerInvoiceMapper {
  static toDomain(document) {
    if (!document) {
      return null;
    }

    // Handle populated objects - extract _id if it's an object
    // Access raw document via _doc to get original ObjectIds even if populate failed
    const getObjectId = (fieldName) => {
      const field = document[fieldName];
      
      // If field is populated object with _id, return it
      if (field && typeof field === 'object' && field._id) {
        return field._id.toString();
      }
      
      // If populate returned null, try to get raw ObjectId from _doc
      if (!field && document._doc && document._doc[fieldName]) {
        const rawValue = document._doc[fieldName];
        if (rawValue) {
          if (typeof rawValue === 'object' && rawValue.constructor && rawValue.constructor.name === 'ObjectId') {
            return rawValue.toString();
          }
          if (typeof rawValue === 'object' && rawValue.toString) {
            return rawValue.toString();
          }
          if (typeof rawValue === 'string') {
            return rawValue;
          }
        }
      }
      
      // If it's a Mongoose ObjectId (not populated)
      if (field && typeof field === 'object' && field.constructor && field.constructor.name === 'ObjectId') {
        return field.toString();
      }
      
      // If it's an object with toString method
      if (field && typeof field === 'object' && field.toString) {
        const str = field.toString();
        // Check if it's a valid ObjectId string
        if (str && str.length === 24 && /^[0-9a-fA-F]{24}$/.test(str)) {
          return str;
        }
      }
      
      // If it's already a string
      if (field && typeof field === 'string') {
        return field;
      }
      
      return null;
    };

    return new ManufacturerInvoice(
      document._id.toString(),
      getObjectId('fromManufacturer'),
      getObjectId('toDistributor'),
      getObjectId('drug'),
      getObjectId('proofOfProduction'),
      getObjectId('nftInfo'),
      document.invoiceNumber,
      document.invoiceDate || null,
      document.quantity || 0,
      document.unitPrice || null,
      document.totalAmount || null,
      document.vatRate || null,
      document.vatAmount || null,
      document.finalAmount || null,
      document.notes || null,
      document.status || InvoiceStatus.PENDING,
      document.chainTxHash || null,
      document.tokenIds || [],
      document.externalId || null,
      document.batchNumber || null
    );
  }

  static toPersistence(aggregate) {
    if (!aggregate) {
      return null;
    }

    // Ensure fromManufacturerId is converted to ObjectId if it's a valid string
    let fromManufacturerId = aggregate.fromManufacturerId;
    if (fromManufacturerId && typeof fromManufacturerId === 'string' && mongoose.Types.ObjectId.isValid(fromManufacturerId)) {
      fromManufacturerId = new mongoose.Types.ObjectId(fromManufacturerId);
    }

    // Ensure toDistributorId is converted to ObjectId if it's a valid string
    let toDistributorId = aggregate.toDistributorId;
    if (toDistributorId && typeof toDistributorId === 'string' && mongoose.Types.ObjectId.isValid(toDistributorId)) {
      toDistributorId = new mongoose.Types.ObjectId(toDistributorId);
    }

    // Ensure drugId is converted to ObjectId if it's a valid string
    let drugId = aggregate.drugId;
    if (drugId && typeof drugId === 'string' && mongoose.Types.ObjectId.isValid(drugId)) {
      drugId = new mongoose.Types.ObjectId(drugId);
    }

    const isObjectId = aggregate.id && aggregate.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(aggregate.id);

    const document = {
      fromManufacturer: fromManufacturerId,
      toDistributor: toDistributorId,
      drug: drugId,
      proofOfProduction: aggregate.proofOfProductionId || null,
      nftInfo: aggregate.nftInfoId || null,
      invoiceNumber: aggregate.invoiceNumber,
      invoiceDate: aggregate.invoiceDate || null,
      quantity: aggregate.quantity,
      unitPrice: aggregate.unitPrice || null,
      totalAmount: aggregate.totalAmount || null,
      vatRate: aggregate.vatRate || null,
      vatAmount: aggregate.vatAmount || null,
      finalAmount: aggregate.finalAmount || null,
      notes: aggregate.notes || null,
      status: aggregate.status,
      chainTxHash: aggregate.chainTxHash || null,
      tokenIds: aggregate.tokenIds || [],
      batchNumber: aggregate.batchNumber || null,
      updatedAt: aggregate.updatedAt || new Date(),
      externalId: aggregate.externalId || (!isObjectId ? aggregate.id : undefined),
    };

    // Only include _id if it's a valid MongoDB ObjectId
    if (isObjectId) {
      document._id = aggregate.id;
    }

    if (document.externalId === undefined) {
      delete document.externalId;
    }

    return document;
  }
}

