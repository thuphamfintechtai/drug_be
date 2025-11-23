// Script để tạo tài khoản pharmacy test
// Chạy: node create-pharmacy-test-account.js

import dotenv from 'dotenv';
import { connectDatabase } from '../src/infrastructure/database/mongoose/connection.js';

dotenv.config();

const createPharmacyTestAccount = async () => {
  try {
    await connectDatabase();
    
    const { UserModel } = await import('../src/bounded-contexts/identity-access/infrastructure/persistence/mongoose/schemas/UserSchema.js');
    const { PharmacyModel } = await import('../src/bounded-contexts/registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js');
    const bcrypt = await import('bcryptjs');
    
    const email = 'pharmacytest@example.com';
    const password = 'password123';
    
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      console.log('Pharmacy account already exists!');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      return;
    }
    
    // Create user
    const hashedPassword = await bcrypt.default.hash(password, 10);
    const user = new UserModel({
      username: 'pharmacytest',
      email: email,
      password: hashedPassword,
      fullName: 'Test Pharmacy',
      role: 'pharmacy',
      status: 'active',
      walletAddress: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
    });
    
    await user.save();
    console.log('User created:', user._id);
    
    // Create pharmacy entity
    const pharmacy = new PharmacyModel({
      user: user._id,
      name: 'Test Pharmacy',
      licenseNo: 'PHARMACY_TEST_' + Date.now(),
      taxCode: 'TAX_PHARMACY_' + Date.now(),
      country: 'Vietnam',
      address: 'Test Address',
      contactEmail: email,
      contactPhone: '0123456789',
      walletAddress: user.walletAddress,
      status: 'active'
    });
    
    await pharmacy.save();
    console.log('Pharmacy entity created:', pharmacy._id);
    
    // Link pharmacy to user
    user.pharmacy = pharmacy._id;
    await user.save();
    
    console.log('\nPharmacy test account created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Pharmacy ID: ${pharmacy._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating pharmacy account:', error);
    process.exit(1);
  }
};

createPharmacyTestAccount();

