// src/common/filters/http-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponse {
  ok: false;
  e: {
    code: string | number;
    message: string | object;
  };
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorMessage: string | object;
    let errorCode: string | number = status;

    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      if ('message' in exceptionResponse) {
        errorMessage = (exceptionResponse as any).message;
      } else {
        errorMessage = exceptionResponse;
      }
      if ('error' in exceptionResponse) {
        errorCode = (exceptionResponse as any).error;
      }
    } else {
      errorMessage = 'Internal server error';
    }

    const errorResponse: ErrorResponse = {
      ok: false,
      e: {
        code: errorCode,
        message: errorMessage,
      },
    };

    response.status(status).json(errorResponse);
  }
}