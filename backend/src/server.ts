import { readConfig } from './config/env.js';
import { createApp } from './app.js';
import { PrismaClient } from '@prisma/client';

const config = readConfig();
const prisma = new PrismaClient();
const server = createApp({ prisma, config }).listen(config.PORT, '127.0.0.1', () => {
  console.log(`Identity & Access API listening on 127.0.0.1:${config.PORT}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
}
process.on('SIGINT', () => { void shutdown(); });
process.on('SIGTERM', () => { void shutdown(); });
