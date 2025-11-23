import { ApplicationBootstrap } from "../../src/composition-root/bootstrap.js";
import { createApp } from "../../src/presentation/app.js";

let app = null;
let bootstrap = null;

async function initializeTestApp() {
  if (app) return app;

  try {
    // Bootstrap application
    bootstrap = new ApplicationBootstrap();
    await bootstrap.initialize();
    await bootstrap.initializeMiddleware();

    // Get routes
    const routes = bootstrap.getRoutes();

    // Create Express app
    app = createApp(routes);

    return app;
  } catch (error) {
    console.error("Lỗi khi khởi động test app:", error);
    throw error;
  }
}

// Initialize app
const testAppPromise = initializeTestApp();

export default testAppPromise;
