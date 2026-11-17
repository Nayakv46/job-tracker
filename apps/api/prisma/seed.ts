import { main as seedDemo } from './seeds/demoSeed.js';

async function main() {
  await seedDemo();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
