import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Setting from "../models/Setting.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected. Seeding admin account...");

    const email = process.env.SEED_ADMIN_EMAIL || "admin@rakhi.com";
    const password = process.env.SEED_ADMIN_PASSWORD || "Admin@123";

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Admin already exists: ${email}`);
    } else {
      await User.create({
        name: "Super Admin",
        email,
        password,
        role: "super_admin",
      });
      console.log(`Super Admin created: ${email} / ${password}`);
      console.log("Please log in and change this password.");
    }

    const settingsExist = await Setting.findOne({ key: "site_settings" });
    if (!settingsExist) {
      await Setting.create({ key: "site_settings" });
      console.log("Default site settings created.");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
