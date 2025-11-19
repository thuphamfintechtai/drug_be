import { createApp } from "./presentation/app.js";
import { ApplicationBootstrap } from "./composition-root/bootstrap.js";
import { appConfig } from "./infrastructure/config/app.config.js";
import { listenToDistributorToPharmacyEvent } from "./bounded-contexts/supply-chain/infrastructure/blockchain/event-listeners/BlockchainEventListener.js";

async function startServer() {
  try {
    // Bootstrap application
    const bootstrap = new ApplicationBootstrap();
    await bootstrap.initialize();

    // Get routes
    const routes = bootstrap.getRoutes();

    // Create Express app
    const app = createApp(routes);

    // Start server
    const PORT = appConfig.port;
    app.listen(PORT, () => {
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
}

startServer();

export default startServer;
