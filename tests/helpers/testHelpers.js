import User from "../../models/User.js";
import PharmaCompany from "../../models/PharmaCompany.js";
import Distributor from "../../models/Distributor.js";
import Pharmacy from "../../models/Pharmacy.js";
import RegistrationRequest from "../../models/RegistrationRequest.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt.js";

export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@test.com`,
    password: await bcrypt.hash("password123", 10),
    fullName: "Test User",
    role: "user",
    status: "active",
    ...userData,
  };

  return await User.create(defaultUser);
};

export const createTestAdmin = async (adminData = {}) => {
  const defaultAdmin = {
    username: `testadmin_${Date.now()}`,
    email: `admin_${Date.now()}@test.com`,
    password: await bcrypt.hash("password123", 10),
    fullName: "Test Admin",
    role: "system_admin",
    isAdmin: true,
    status: "active",
    ...adminData,
  };

  return await User.create(defaultAdmin);
};

export const createTestPharmaCompany = async (userData = {}, companyData = {}) => {
  const user = await createTestUser({
    ...userData,
    role: "pharma_company",
    walletAddress: "0x1234567890123456789012345678901234567890",
  });

  const company = await PharmaCompany.create({
    user: user._id,
    name: "Test Pharma Company",
    licenseNo: `LIC_${Date.now()}`,
    taxCode: `TAX_${Date.now()}`,
    gmpCertNo: "GMP123",
    country: "Vietnam",
    address: "Test Address",
    contactEmail: user.email,
    contactPhone: "0123456789",
    walletAddress: user.walletAddress,
    status: "active",
    ...companyData,
  });

  user.pharmaCompany = company._id;
  await user.save();

  return { user, company };
};

export const createTestDistributor = async (userData = {}, distributorData = {}) => {
  const user = await createTestUser({
    ...userData,
    role: "distributor",
    walletAddress: "0x1234567890123456789012345678901234567890",
  });

  const distributor = await Distributor.create({
    user: user._id,
    name: "Test Distributor",
    licenseNo: `LIC_${Date.now()}`,
    taxCode: `TAX_${Date.now()}`,
    country: "Vietnam",
    address: "Test Address",
    contactEmail: user.email,
    contactPhone: "0123456789",
    walletAddress: user.walletAddress,
    status: "active",
    ...distributorData,
  });

  user.distributor = distributor._id;
  await user.save();

  return { user, distributor };
};

export const createTestPharmacy = async (userData = {}, pharmacyData = {}) => {
  const user = await createTestUser({
    ...userData,
    role: "pharmacy",
    walletAddress: "0x1234567890123456789012345678901234567890",
  });

  const pharmacy = await Pharmacy.create({
    user: user._id,
    name: "Test Pharmacy",
    licenseNo: `LIC_${Date.now()}`,
    taxCode: `TAX_${Date.now()}`,
    country: "Vietnam",
    address: "Test Address",
    contactEmail: user.email,
    contactPhone: "0123456789",
    walletAddress: user.walletAddress,
    status: "active",
    ...pharmacyData,
  });

  user.pharmacy = pharmacy._id;
  await user.save();

  return { user, pharmacy };
};

export const createTestRegistrationRequest = async (user, requestData = {}) => {
  return await RegistrationRequest.create({
    user: user._id,
    role: user.role,
    status: "pending",
    companyInfo: {
      name: "Test Company",
      licenseNo: `LIC_${Date.now()}`,
      taxCode: `TAX_${Date.now()}`,
      ...requestData.companyInfo,
    },
    ...requestData,
  });
};

export const getAuthToken = (user) => {
  return generateToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });
};

export const getAuthHeader = (user) => {
  const token = getAuthToken(user);
  return `Bearer ${token}`;
};

