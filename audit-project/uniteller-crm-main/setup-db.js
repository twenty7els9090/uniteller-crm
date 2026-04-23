const { Client } = require('pg');

const SQL = `
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'vtb',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "token" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_token_key" UNIQUE ("token"),
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organization" TEXT NOT NULL,
  "partner" TEXT NOT NULL,
  "zayavka" TEXT NOT NULL,
  "status" TEXT,
  "activityType" TEXT NOT NULL DEFAULT '',
  "comment" TEXT,
  "contactInfo" TEXT NOT NULL DEFAULT '',
  "margin" TEXT NOT NULL DEFAULT '',
  "manager" TEXT NOT NULL,
  "turnoverTsp" TEXT NOT NULL DEFAULT '',
  "ourRate" TEXT NOT NULL DEFAULT '',
  "revenue" TEXT NOT NULL DEFAULT '',
  "reported" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Relegal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fromOrg" TEXT NOT NULL DEFAULT '',
  "toOrg" TEXT NOT NULL DEFAULT '',
  "action" TEXT NOT NULL DEFAULT '',
  "manager" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Additional" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organization" TEXT NOT NULL,
  "partner" TEXT NOT NULL DEFAULT '',
  "finInstrument" TEXT NOT NULL DEFAULT '',
  "turnover" TEXT NOT NULL DEFAULT '',
  "revenue" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Churn" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organization" TEXT NOT NULL,
  "turnoverTsp" TEXT NOT NULL DEFAULT '',
  "revenue" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT '',
  "comment" TEXT NOT NULL DEFAULT '',
  "reported" BOOLEAN NOT NULL DEFAULT false,
  "manager" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Setting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "category" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Setting_category_value_key" UNIQUE ("category", "value")
);

CREATE INDEX IF NOT EXISTS "Setting_category_idx" ON "Setting"("category");

INSERT INTO "User" ("id", "username", "password", "fullName", "role")
VALUES ('usr_admin_01', 'uniteller', 'cat16', 'Uniteller', 'uniteller'),
       ('usr_vtb_01', 'vtb', 'vtbx', 'ВТБ', 'vtb')
ON CONFLICT DO NOTHING;
`;

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.jbibixrgsdylwwwelyjf:R7vaYjRewv0RBYvP@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10&sslmode=no-verify'
  });
  await client.connect();
  
  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  console.log('Existing tables:', tables.rows.map(r => r.table_name));
  
  if (tables.rows.length === 0) {
    console.log('Creating tables...');
    await client.query(SQL);
    console.log('All tables created!');
  } else {
    console.log('Tables already exist, skipping creation.');
  }
  
  const users = await client.query('SELECT username, role FROM "User"');
  console.log('Users:', users.rows);
  
  await client.end();
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
