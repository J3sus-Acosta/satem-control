export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: any;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado / Token inválido') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto / Recurso duplicado') {
    super(message, 409, 'CONFLICT');
  }
}
