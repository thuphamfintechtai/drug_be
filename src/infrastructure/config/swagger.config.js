import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Drug Traceability Backend API",
      version: "1.0.0",
      description:
        "API documentation cho hệ thống truy xuất nguồn gốc thuốc sử dụng blockchain",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:9000",
        description: "Development server",
      },
      {
        url: "https://drug-be.vercel.app",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Nhập JWT token với Bearer prefix. Ví dụ: Bearer {token}",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Thông báo lỗi",
            },
            error: {
              type: "string",
              description: "Chi tiết lỗi",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Thông báo thành công",
            },
            data: {
              type: "object",
              description: "Dữ liệu trả về",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "password123",
            },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "JWT token",
            },
            user: {
              type: "object",
              properties: {
                id: { type: "string" },
                email: { type: "string" },
                role: { type: "string" },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Xác thực và đăng nhập" },
      { name: "Users", description: "Quản lý người dùng" },
      { name: "Registration", description: "Đăng ký doanh nghiệp" },
      { name: "Drugs", description: "Quản lý thuốc" },
      { name: "Production", description: "Sản xuất và NFT" },
      { name: "Distributor", description: "Nhà phân phối" },
      { name: "Pharmacy", description: "Nhà thuốc" },
      { name: "Public", description: "API công khai" },
      { name: "Admin", description: "Quản trị viên" },
      { name: "Statistics", description: "Thống kê" },
    ],
  },
  apis: ["./src/presentation/app.js", "./src/bounded-contexts/**/routes/*.js"], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);
