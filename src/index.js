import { createApp } from "./presentation/app.js";
import { ApplicationBootstrap } from "./composition-root/bootstrap.js";
import { appConfig } from "./infrastructure/config/app.config.js";
import { listenToDistributorToPharmacyEvent } from "./bounded-contexts/supply-chain/infrastructure/blockchain/event-listeners/BlockchainEventListener.js";

let app = null;
let bootstrap = null;

async function initializeApp() {
  if (app) return app;

  try {
    // Bootstrap application
    bootstrap = new ApplicationBootstrap();
    await bootstrap.initialize();

    // Get routes
    const routes = bootstrap.getRoutes();

    // Create Express app
    app = createApp(routes);

    return app;
  } catch (error) {
    console.error("Lỗi khi khởi động server:", error);
    throw error;
  }
}

// Initialize app immediately for Vercel
const expressAppPromise = initializeApp();

// For Vercel serverless functions - export the app
export default async (req, res) => {
  const expressApp = await expressAppPromise;
  return expressApp(req, res);
};

// For local development
if (process.env.VERCEL !== "1") {
  (async function startServer() {
    try {
      const expressApp = await expressAppPromise;

      // Start server
      const PORT = appConfig.port;
      expressApp.listen(PORT, () => {
        console.log(`Server đang chạy trên port ${PORT}`);

        // Khởi động event listener sau khi server đã chạy
        try {
          listenToDistributorToPharmacyEvent()
            .then(() => {
              console.log("Event listener đã được khởi động thành công");
            })
            .catch((error) => {
              console.error("Lỗi khi khởi động event listener:", error);
            });
        } catch (error) {
          console.error("Lỗi khi khởi động event listener:", error);
        }
      });
    } catch (error) {
      console.error("Lỗi khi khởi động server:", error);
      process.exit(1);
    }
  })();
}
