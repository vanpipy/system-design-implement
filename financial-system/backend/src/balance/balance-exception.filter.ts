import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class BalanceExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('BalanceExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus() as HttpStatus;
      const res = exception.getResponse() as
        | { message?: string | string[] }
        | string;
      const msg =
        typeof res === 'string'
          ? res
          : Array.isArray(res?.message)
            ? res.message.join('; ')
            : (res?.message ?? '');
      const errorCode =
        status === HttpStatus.BAD_REQUEST
          ? 'INVALID_PARAMS'
          : status === HttpStatus.NOT_FOUND
            ? 'NOT_FOUND'
            : 'ERROR';

      this.logger.error(`${errorCode} ${status} ${msg}`);
      response.status(status).json({
        errorCode,
        message: msg || exception.message,
      });
      return;
    }

    this.logger.error(
      `INTERNAL_ERROR 500 ${(exception as Error)?.message ?? ''}`,
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
}
