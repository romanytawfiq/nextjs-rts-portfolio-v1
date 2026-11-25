import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

function timestampedName() {
  return `portfolio-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`;
}

// The local dev default matches scripts/set-admin-password.mjs and .env.example.
const source = path.resolve(
  process.env.SQLITE_PATH || path.join(process.cwd(), ".data", "portfolio.sqlite"),
);
const destination = path.resolve(
  process.argv[2] || path.join(process.cwd(), "backups", timestampedName()),
);

function redact(message) {
  return message.split(source).join("[source]").split(destination).join("[target]");
}

function main() {
  if (!existsSync(source)) {
    throw new Error("Source SQLite file not found.");
  }
  if (source === destination) {
    throw new Error("Backup destination must differ from the source database.");
  }
  if (existsSync(destination)) {
    throw new Error("Backup destination already exists.");
  }

  mkdirSync(path.dirname(destination), { recursive: true });

  const db = new DatabaseSync(source);
  try {
    db.exec("PRAGMA busy_timeout = 5000;");
    // VACUUM INTO writes a compact, transactionally consistent snapshot of the
    // source, including committed WAL content, without modifying the source.
    db.prepare("VACUUM INTO ?").run(destination);
  } finally {
    db.close();
  }

  const { size } = statSync(destination);
  console.log(`Backup created (${size} bytes).`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  // Never echo environment values; paths are redacted as an extra safeguard.
  console.error(`Backup failed: ${redact(message)}`);
  process.exitCode = 1;
}
