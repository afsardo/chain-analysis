import { createLogger, format, transports } from "winston";
import dotenv from "dotenv";

import { fetchLatestBlockHeight } from "./node";
import { sleep } from "./util";

async function Run() {
  dotenv.config();

  const logger = createLogger({
    level: process.env.LOG_LEVEL,
    format: format.simple(),
    defaultMeta: {
      service: process.env.SERVICE_NAME,
    },
    transports: [new transports.Console()],
  });

  const chainId = process.env.CHAIN_ID as string;
  const lcdEndpoint = process.env.LCD_ENDPOINT as string;
  const rpcEndpoint = process.env.RPC_ENDPOINT as string;
  const sampleInterval = Number(process.env.SAMPLE_INTERVAL || "1000");

  logger
    .child({
      rest: lcdEndpoint,
      rpc: rpcEndpoint,
      sample_interval: sampleInterval,
    })
    .info(`Starting chain analysis on chain ${chainId}`);

  const blockSamples = [];
  let lastBlockHeight: number | null = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const startTime = process.hrtime();
    const currentBlockHeight = await fetchLatestBlockHeight(rpcEndpoint);
    if (lastBlockHeight) {
      const blockDiff = currentBlockHeight - lastBlockHeight;
      logger.debug(`Block height diff: ${blockDiff}`);
      blockSamples.push(blockDiff);
      logger.info(`Sample size: ${blockSamples.length}`);
      const averageBlocks = blockSamples.reduce((a, b) => a + b, 0) / blockSamples.length;
      logger.info(`Average blocks per ${sampleInterval / 1000}s: ${averageBlocks}`);
      logger.info(`Average block time: ${sampleInterval / averageBlocks}ms`);
    }
    lastBlockHeight = currentBlockHeight;
    const endTime = process.hrtime(startTime);
    const elapsedTime = endTime[0] * 1000 + endTime[1] / 1000000;
    const sleepTime = sampleInterval - elapsedTime;
    logger.debug(`Sleep time ${sleepTime}`);
    await sleep(sleepTime);
  }
}

Run().catch((error) => {
  console.error(error);
  process.exit(1);
});
