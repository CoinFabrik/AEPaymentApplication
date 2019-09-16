import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException, HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    // TODO: Less info for prod.
    const msg: any = {
      error: true,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    console.log(exception);
    if (exception instanceof Error) {
      msg.name = exception.name;
      msg.message = exception.message;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      msg.detail = exception.getResponse();
    } else {
      msg.message = 'Unsupported host type';

    }
    response.status(statusCode).json(msg);
  }
}
