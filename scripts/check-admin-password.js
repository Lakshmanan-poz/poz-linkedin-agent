// Script to check what password the current admin hashes correspond to
const bcrypt = require("bcryptjs");

const currentHash = "$2b$10$DAzp67rvUqMIn8hfDffFKeXx5dT9mluuqOAh5/M4kVED8OEM.lZ66";

const candidates = [
  "poz@123",
  "admin123",
  "poz123",
  "admin",
  "password"
];

async function checkPasswords() {
  console.log("Testing password candidates against current admin hash:");

  for (const password of candidates) {
    const matches = await bcrypt.compare(password, currentHash);
    console.log(`${password}: ${matches ? "✓ MATCH" : "✗ no match"}`);
  }
}

checkPasswords().catch(console.error);