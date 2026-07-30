import { beforeAll, afterEach, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Call this once at the top of any test file that needs a real (in-memory)
// MongoDB. Spins up a fresh instance per test file, wipes all collections
// between individual tests, and tears everything down at the end.
export const setupTestDB = () => {
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }, 30000);

  afterEach(async () => {
    if (mongoose.connection.readyState !== 1) return; // not connected — nothing to clean up
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
    if (mongod) await mongod.stop();
  });
};
