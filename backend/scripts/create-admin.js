const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Käytetään olemassa olevaa User-mallia
const User = require('../models/User');

async function createAdmin() {
  try {
    // Tarkista että pakolliset ympäristömuuttujat on määritelty
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminEmail || !adminPassword) {
      console.error('Virhe: ADMIN_USERNAME, ADMIN_EMAIL ja ADMIN_PASSWORD ympäristömuuttujat vaaditaan');
      return process.exit(1);
    }

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/messagewall';
    await mongoose.connect(mongoURI);
    console.log('MongoDB-yhteys muodostettu');

    // Tarkista onko admin jo olemassa
    const existingAdmin = await User.findOne({ username: adminUsername });
    if (existingAdmin) {
      console.log(`Käyttäjä ${adminUsername} on jo olemassa`);
      return mongoose.disconnect();
    }

    // Salaa salasana
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Luo organizer-käyttäjä
    const admin = new User({
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      role: 'organizer',
      customRole: {
        name: 'Admin',
        color: process.env.ADMIN_COLOR || '#FF0000'
      }
    });

    await admin.save();
    console.log('Organizer-käyttäjä luotu onnistuneesti:');
    console.log({
      username: admin.username,
      email: admin.email,
      role: admin.role,
      customRole: admin.customRole
    });
    
    return mongoose.disconnect();
  } catch (error) {
    console.error('Virhe käyttäjän luomisessa:', error);
    return mongoose.disconnect();
  }
}

createAdmin();