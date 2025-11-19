import dotenv from "dotenv";

dotenv.config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_BASE_URL = "https://api.pinata.cloud";

export class IPFSService {
  constructor() {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      console.warn("PINATA_API_KEY và PINATA_SECRET_KEY chưa được cấu hình");
    }
  }

  async uploadFolderToIPFS(quantity, metadata) {
    try {
      if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        throw new Error("PINATA_API_KEY và PINATA_SECRET_KEY phải được cấu hình trong environment variables");
      }

      if (!quantity || quantity <= 0) {
        throw new Error("Quantity phải lớn hơn 0");
      }

      // Tạo folder name với timestamp để unique
      const folderName = `drug_package_${Date.now()}`;
      const formData = new FormData();

      for (let i = 1; i <= quantity; i++) {
        const nftMetadata = {
          name: metadata?.name || `NFT #${i}`,
          description: metadata?.description || `Drug Package #${i}`,
          image: metadata?.image || "",
          attributes: metadata?.attributes || [],
          serialNumber: i,
          quantity: quantity,
          range: { from: 1, to: quantity },
        };

        const metadataBlob = new Blob([JSON.stringify(nftMetadata, null, 2)], {
          type: "application/json",
        });

        // Sử dụng path với folder name để Pinata nhận diện đây là folder
        formData.append("file", metadataBlob, `${folderName}/${i}.json`);
      }

      // Thêm pinataOptions để Pinata biết đây là folder upload
      const pinataOptions = JSON.stringify({
        wrapWithDirectory: true,
      });
      formData.append("pinataOptions", pinataOptions);

      // Gọi Pinata API để upload folder
      const response = await fetch(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, {
        method: "POST",
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Pinata API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const ipfsHash = data.IpfsHash;
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      return {
        success: true,
        ipfsHash,
        ipfsUrl,
        folderName,
        quantity,
      };
    } catch (error) {
      console.error("Lỗi khi upload lên IPFS:", error);
      throw error;
    }
  }

  async uploadMetadata(metadata) {
    try {
      if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        throw new Error("PINATA_API_KEY và PINATA_SECRET_KEY phải được cấu hình");
      }

      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: "application/json",
      });

      const formData = new FormData();
      formData.append("file", metadataBlob, "metadata.json");

      const response = await fetch(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, {
        method: "POST",
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Pinata API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const ipfsHash = data.IpfsHash;
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      return {
        success: true,
        ipfsHash,
        ipfsUrl,
      };
    } catch (error) {
      console.error("Lỗi khi upload metadata lên IPFS:", error);
      throw error;
    }
  }
}

