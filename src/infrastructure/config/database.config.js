import dotenv from "dotenv";

dotenv.config();

export const databaseConfig = {
  uri: process.env.MONGODB_URI,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};

