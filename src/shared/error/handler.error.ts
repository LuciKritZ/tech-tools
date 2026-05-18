import { Logger } from 'pino';
import { BaseError } from './base.error';

export class ErrorHandler {
  private logger: Logger;

  constructor(loggerInstance: Logger) {
    this.logger = loggerInstance;
  }

  /**
   * Handles all the error related tasks, like logging, alerts, etc.
   * @param {Error} err
   */
  public async handleError(err: Error): Promise<void> {
    this.logger.error(err);
  }

  /**
   * Checks whether the error is trusted i.e., operational error
   * @param {Error} error
   * @returns {boolean}
   */
  public isTrustedError(error: Error): boolean {
    return error instanceof BaseError && error.isOperational;
  }
}
