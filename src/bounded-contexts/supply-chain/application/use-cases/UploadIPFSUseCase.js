import { UploadIPFSDTO } from "../dto/UploadIPFSDTO.js";
import { IPFSService } from "../../infrastructure/external/ipfs/IPFSService.js";

export class UploadIPFSUseCase {
  constructor(ipfsService, eventBus) {
    this._ipfsService = ipfsService || new IPFSService();
    this._eventBus = eventBus;
  }

  async execute(dto, manufacturerId) {
    dto.validate();

    // Upload to IPFS
    const ipfsResult = await this._ipfsService.uploadFolderToIPFS(dto.quantity, dto.metadata);

    // Save IPFS status to database (ManufactureIPFSStatus)
    const ManufactureIPFSStatusModel = (await import("../../../../models/manufactureIPFSStatus.js")).default;
    const { PharmaCompanyModel } = (await import("../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js"));

    // Find PharmaCompany by manufacturerId (could be _id or user id)
    let pharmaCompany = await PharmaCompanyModel.findById(manufacturerId);
    if (!pharmaCompany) {
      // Try to find by user id
      pharmaCompany = await PharmaCompanyModel.findOne({ user: manufacturerId });
    }

    if (pharmaCompany) {
      const manufactureIPFSStatusDoc = new ManufactureIPFSStatusModel({
        manufacture: pharmaCompany._id,
        timespan: Date.now().toString(),
        status: "Pending",
        quantity: dto.quantity,
        IPFSUrl: ipfsResult.ipfsUrl,
      });

      await manufactureIPFSStatusDoc.save();
    }

    return {
      ipfsHash: ipfsResult.ipfsHash,
      ipfsUrl: ipfsResult.ipfsUrl,
      amount: ipfsResult.amount,
      range: ipfsResult.range,
      folderName: ipfsResult.folderName,
    };
  }
}

