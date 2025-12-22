import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let message = 'Something went wrong';
    let status = HttpStatus.BAD_REQUEST;

    // Handle known Prisma error codes
    if (exception.code === 'P2002') {
      message = `Duplicate value for unique field: ${exception.meta?.target}`;
    }

    response.status(status).json({
      success: false,
      message,
    });
  }
}
