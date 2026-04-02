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

  private sanitize(input: string) {
    if (!input) return input;
    return input
      .replace(
        /(idempotencyKey|accountId|requestId)\s*[:=]\s*([A-Za-z0-9_\-:]+)/gi,
        (_m, k) => `${k}=[REDACTED]`,
      )
      .replace(
        /"(idempotencyKey|accountId|requestId)"\s*:\s*"[^"]*"/gi,
        (_m, k) => `"${k}":"[REDACTED]"`,
      )
      .replace(
        /(DATABASE_URL)\s*[:=]\s*([^\s"']+)/gi,
        (_m, k) => `${k}=[REDACTED]`,
      )
      .replace(/:\/\/([^:\s]+):([^@]+)@/g, '://$1:[REDACTED]@')
      .replace(/"password"\s*:\s*"[^"]*"/gi, '"password":"[REDACTED]"');
  }

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

      const safeMsg = this.sanitize(msg);
      this.logger.error(`${errorCode} ${status} ${safeMsg}`);
      response.status(status).json({
        errorCode,
        message: safeMsg || 'Request failed',
      });
      return;
    }

    const em = (exception as Error)?.message ?? '';
    const safeEm = this.sanitize(em);
    this.logger.error(`INTERNAL_ERROR 500 ${safeEm}`);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
}
