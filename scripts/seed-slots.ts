import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BATCH = 5_000;
const TOTAL = 1_000_000;

async function main() {
  const existing = await prisma.slot.count();
  if (existing >= TOTAL) {
    console.log(`Already seeded: ${existing} slots`);
    return;
  }

  console.log(`Seeding ${TOTAL.toLocaleString()} slots (starting from ${existing})...`);
  const start = Date.now();

  // Use raw SQL for performance with SQLite
  for (let offset = existing; offset < TOTAL; offset += BATCH) {
    const end = Math.min(offset + BATCH, TOTAL);
    const values: string[] = [];
    for (let i = offset; i < end; i++) {
      const row = Math.floor(i / 1000);
      const col = i % 1000;
      values.push(`(${i},${row},${col},'available')`);
    }
    await prisma.$executeRawUnsafe(
      `INSERT OR IGNORE INTO Slot (id, row, col, status, createdAt, updatedAt) VALUES ${values.map(v => v.replace("'available'", `'available','${new Date().toISOString()}','${new Date().toISOString()}'`)).join(",")}`
    );
    process.stdout.write(`\r  ${end.toLocaleString()} / ${TOTAL.toLocaleString()}`);
  }

  const total = await prisma.slot.count();
  console.log(`\nDone in ${((Date.now() - start) / 1000).toFixed(1)}s — ${total.toLocaleString()} slots`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
