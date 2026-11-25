import { createHash, randomBytes, scryptSync } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { DatabaseSync } from "node:sqlite";

const KEY_LENGTH = 64;
const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,64}$/;

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function versionForHash(hash) {
  return createHash("sha256").update(hash).digest("hex").slice(0, 32);
}

async function readHidden(promptText) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    const fallback = createInterface({ input: process.stdin, output: process.stdout });
    const value = await fallback.question(promptText);
    fallback.close();
    return value;
  }

  process.stdout.write(promptText);
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const wasRaw = input.isRaw;
    let value = "";
    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");

    const finish = (error) => {
      input.off("data", onData);
      input.setRawMode(Boolean(wasRaw));
      input.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (chunk) => {
      for (const char of String(chunk)) {
        if (char === "\r" || char === "\n") {
          finish();
          return;
        }
        if (char === "\u0003") {
          finish(new Error("Cancelled"));
          return;
        }
        if (char === "\u007f" || char === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        value += char;
        process.stdout.write("*");
      }
    };

    input.on("data", onData);
  });
}

async function main() {
  let username = process.env.ADMIN_USERNAME;
  if (username === undefined) {
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    username = await prompt.question("Username: ");
    prompt.close();
  }
  const trimmedUsername = username.trim();

  const password = process.env.ADMIN_PASSWORD ?? (await readHidden("Password: "));
  if (process.env.ADMIN_PASSWORD === undefined) {
    const confirmation = await readHidden("Confirm password: ");
    if (confirmation !== password) {
      throw new Error("Passwords do not match.");
    }
  }

  if (!USERNAME_PATTERN.test(trimmedUsername)) {
    throw new Error("Username must be 3-64 characters: letters, numbers, _, . or -.");
  }
  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }

  const file = process.env.SQLITE_PATH
    ? path.resolve(process.env.SQLITE_PATH)
    : path.join(process.cwd(), ".data", "portfolio.sqlite");
  mkdirSync(path.dirname(file), { recursive: true });

  const db = new DatabaseSync(file);
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_credentials (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      auth_version TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_login_at TEXT
    );
  `);
  const columns = db.prepare("PRAGMA table_info(admin_credentials)").all();
  if (!columns.some((column) => column.name === "auth_version")) {
    db.exec("ALTER TABLE admin_credentials ADD COLUMN auth_version TEXT;");
  }

  const now = new Date().toISOString();
  const passwordHash = hashPassword(password);
  db.prepare(
    `INSERT INTO admin_credentials
      (id, username, password_hash, auth_version, enabled, created_at, updated_at, last_login_at)
     VALUES (1, ?, ?, ?, 1, ?, ?, NULL)
     ON CONFLICT(id) DO UPDATE SET
       username = excluded.username,
       password_hash = excluded.password_hash,
       auth_version = excluded.auth_version,
       enabled = 1,
       updated_at = excluded.updated_at`,
  ).run(trimmedUsername, passwordHash, versionForHash(passwordHash), now, now);
  db.close();

  console.log(`Local admin password set for ${trimmedUsername}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
