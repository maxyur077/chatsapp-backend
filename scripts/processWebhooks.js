const path = require("path");
const fs = require("fs").promises;
require("dotenv").config();

const { connectDatabase } = require("../src/config/database");
const WebhookProcessor = require("../src/services/webhookProcessor");
const { logger } = require("../src/utils/logger");

const processWebhookFiles = async () => {
  try {
    await connectDatabase();

    const webhookProcessor = new WebhookProcessor();
    const webhooksDir = path.join(__dirname, "../webhooks");

    // Check if webhooks directory exists
    try {
      await fs.access(webhooksDir);
    } catch (error) {
      logger.error(
        "Webhooks directory not found. Please create it and add JSON files."
      );
      process.exit(1);
    }

    const files = await fs.readdir(webhooksDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    if (jsonFiles.length === 0) {
      logger.info("No JSON files found in webhooks directory");
      process.exit(0);
    }

    logger.info(`Found ${jsonFiles.length} webhook files to process`);

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(webhooksDir, file);
        const fileContent = await fs.readFile(filePath, "utf8");
        const payload = JSON.parse(fileContent);

        logger.info(`Processing file: ${file}`);
        const result = await webhookProcessor.processWebhookPayload(payload);

        logger.info(`Processed ${file}: ${result.length} items processed`);
      } catch (error) {
        logger.error(`Error processing file ${file}:`, error);
      }
    }

    logger.info("All webhook files processed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Error in webhook processing:", error);
    process.exit(1);
  }
};

processWebhookFiles();
