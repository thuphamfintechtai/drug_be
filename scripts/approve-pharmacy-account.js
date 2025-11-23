// Script để approve tài khoản pharmacy
import dotenv from 'dotenv';
import { connectDatabase } from '../src/infrastructure/database/mongoose/connection.js';

dotenv.config();

const approvePharmacyAccount = async () => {
  try {
    await connectDatabase();
    
    const { UserModel } = await import('../src/bounded-contexts/identity-access/infrastructure/persistence/mongoose/schemas/UserSchema.js');
    const { RegistrationRequestModel } = await import('../src/bounded-contexts/registration/infrastructure/persistence/mongoose/schemas/RegistrationRequestSchema.js');
    const { PharmacyModel } = await import('../src/bounded-contexts/registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js');
    
    const email = 'pharmacytest@example.com';

    const user = await UserModel.findOne({ email });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Found user:', user._id);

    // Check if pharmacy already exists
    const existingPharmacy = await PharmacyModel.findOne({ user: user._id });
    if (existingPharmacy) {
      console.log('Pharmacy already exists:', existingPharmacy._id);
      user.status = 'active';
      user.pharmacy = existingPharmacy._id;
      await user.save();
      console.log('User updated and linked to pharmacy');
      console.log('\nPharmacy account is ready!');
      console.log(`Email: ${email}`);
      console.log(`Pharmacy ID: ${existingPharmacy._id}`);
      process.exit(0);
    }

    const regRequest = await RegistrationRequestModel.findOne({ user: user._id });
    
    let pharmacyData = {
      user: user._id,
      name: 'Test Pharmacy',
      licenseNo: 'PHARMACY_TEST_001',
      taxCode: 'TAX_PHARMACY_001',
      country: 'Vietnam',
      address: 'Test Address',
      contactEmail: user.email,
      contactPhone: user.phone || '0123456789',
      walletAddress: user.walletAddress || '0xf4e0020469a2938eebdbdd80ff25bf831518987d',
      status: 'active'
    };

    if (regRequest) {
      console.log('Found registration request:', regRequest._id);
      regRequest.status = 'approved';
      await regRequest.save();
      console.log('Registration request approved');
      
      pharmacyData = {
        user: user._id,
        name: regRequest.companyInfo?.name || 'Test Pharmacy',
        licenseNo: regRequest.companyInfo?.licenseNo || 'PHARMACY_TEST_001',
        taxCode: regRequest.companyInfo?.taxCode || 'TAX_PHARMACY_001',
        country: regRequest.companyInfo?.country || 'Vietnam',
        address: regRequest.companyInfo?.address || 'Test Address',
        contactEmail: user.email,
        contactPhone: regRequest.companyInfo?.contactPhone || user.phone || '0123456789',
        walletAddress: user.walletAddress || '0xf4e0020469a2938eebdbdd80ff25bf831518987d',
        status: 'active'
      };
    } else {
      console.log('No registration request found, creating pharmacy directly');
    }

    const pharmacy = new PharmacyModel(pharmacyData);
    
    await pharmacy.save();
    console.log('Pharmacy entity created:', pharmacy._id);
    
    // Update user
    user.status = 'active';
    user.pharmacy = pharmacy._id;
    await user.save();
    console.log('User updated and linked to pharmacy');
    
    console.log('\nPharmacy account approved successfully!');
    console.log(`Email: ${email}`);
    console.log(`Pharmacy ID: ${pharmacy._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error approving pharmacy account:', error);
    process.exit(1);
  }
};

approvePharmacyAccount();

