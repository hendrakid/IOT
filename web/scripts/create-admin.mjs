// Script untuk membuat admin baru di database
/* 
 cd "E:\Project IOT\IOT\web"
 node scripts/create-admin.mjs nama_admin PasswordMinimal8Karakter
 
 Contoh:
 node scripts/create-admin.mjs admin admin123

*/

import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const [username, password] = process.argv.slice(2);

if (!username || !password) {
  console.error("Usage: node scripts/create-admin.mjs <username> <password>");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters long.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await client.query(
    "INSERT INTO admins (username, password) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING",
    [username, passwordHash]
  );

  if (result.rowCount === 0) {
    console.log(`Admin '${username}' sudah ada; tidak ada perubahan.`);
  } else {
    console.log(`Admin '${username}' berhasil dibuat.`);
  }
} finally {
  await client.end();
}
