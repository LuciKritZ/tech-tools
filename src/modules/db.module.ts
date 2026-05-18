import mongoose from 'mongoose';
import { logger } from '@/shared/logger.shared';

const MAX_RETRIES = 3;
const BASE_DELAY = 5000;

export const databaseService = async (mongoURI: string, retryCount = 0): Promise<void> => {
  logger.info(`<<<<< Connecting to database... (Attempt ${retryCount + 1})`);

  try {
    await mongoose.connect(mongoURI, {
      autoIndex: true,
    });
    logger.info(`...database connected with ${mongoose.connection.host} >>>>>`);
  } catch (error: any) {
    logger.error(`Oops! Error connecting to database: ${error.message || error}`);

    if (retryCount < MAX_RETRIES) {
      const delay = BASE_DELAY * Math.pow(2, retryCount);
      logger.info(`Retrying connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return databaseService(mongoURI, retryCount + 1);
    } else {
      logger.error(`Failed to connect to database after ${MAX_RETRIES} retries`);
      throw new Error(`Failed to connect to database after ${MAX_RETRIES} retries`);
    }
  }
};

export default databaseService;
