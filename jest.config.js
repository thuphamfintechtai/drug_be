export default {
  testEnvironment: "node",
  transform: {},
  moduleFileExtensions: ["js"],
  testMatch: ["**/tests/**/*.test.js"],
  globals: {
    jest: true,
  },
  collectCoverageFrom: [
    "controllers/**/*.js",
    "routes/**/*.js",
    "middleware/**/*.js",
    "services/**/*.js",
    "utils/**/*.js",
    "!**/node_modules/**",
    "!**/tests/**",
  ],
  coverageDirectory: "coverage",
  verbose: true,
  testTimeout: 30000,
};

