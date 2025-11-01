// Node.js 18+ có sẵn FormData và fetch
// Nếu dùng Node.js < 18, cần: npm install form-data và node-fetch

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_BASE_URL = "https://api.pinata.cloud";

// Upload folder lên Pinata IPFS
// quantity: số lượng file cần tạo (từ 1 đến quantity)
export const uploadFolderToIPFS = async (quantity, metadata) => {
  try {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      throw new Error("PINATA_API_KEY và PINATA_SECRET_KEY phải được cấu hình trong environment variables");
    }

    if (!quantity || quantity <= 0) {
      throw new Error("Quantity phải lớn hơn 0");
    }

    // Tạo form data với các file metadata
    const formData = new FormData();
    
    // Tạo folder structure
    // Với mỗi NFT, tạo một file JSON metadata
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

      // Tạo Blob từ metadata JSON (Node.js 18+ FormData hỗ trợ Blob)
      const metadataBlob = new Blob([JSON.stringify(nftMetadata, null, 2)], {
        type: "application/json",
      });
      
      formData.append("file", metadataBlob, `${i}.json`);
    }

    // Gọi Pinata API để upload folder
    // FormData sẽ tự động set Content-Type với boundary
    const response = await fetch(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
        // Không set Content-Type, để FormData tự động set với boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return {
      success: true,
      ipfsHash: result.IpfsHash,
      pinSize: result.PinSize,
      timestamp: result.Timestamp,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      // Trả về thông tin về range token IDs sẽ được mint (từ 1 đến quantity)
      amount: quantity,
      range: {
        from: 1,
        to: quantity,
      },
    };
  } catch (error) {
    console.error("Lỗi khi upload folder lên IPFS:", error);
    throw error;
  }
};

// Upload file đơn lẻ lên Pinata IPFS
export const uploadFileToIPFS = async (fileBuffer, fileName, contentType = "application/json") => {
  try {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      throw new Error("PINATA_API_KEY và PINATA_SECRET_KEY phải được cấu hình trong environment variables");
    }

    const formData = new FormData();
    const fileBlob = new Blob([fileBuffer], { type: contentType });
    formData.append("file", fileBlob, fileName);

    const response = await fetch(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
        // Không set Content-Type, để FormData tự động set với boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return {
      success: true,
      ipfsHash: result.IpfsHash,
      pinSize: result.PinSize,
      timestamp: result.Timestamp,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    };
  } catch (error) {
    console.error("Lỗi khi upload file lên IPFS:", error);
    throw error;
  }
};

