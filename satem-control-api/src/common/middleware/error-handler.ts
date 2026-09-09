import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../errors/app-error.js';
import { ZodError } from 'zod';

export function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
  const requestId = request.id || `req-${Date.now()}`;

  // Log interno para troubleshooting (Fase 54 & 55)
  request.log.error({
    err: error,
    requestId,
    url: request.url,
    method: request.method,
  });

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
      },
    });
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados no superaron las reglas de validación',
        details: error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
        requestId,
      },
    });
  }

  // Error no controlado (nunca exponer stack trace en producción)
  const isDev = process.env.NODE_ENV === 'development';
  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error interno en el servidor',
      details: isDev ? error.message : undefined,
      requestId,
    },
  });
}
