const errorHandler = (err, req, res, next) => {
    console.error(`Error at ${req.method} ${req.url}:`, err);

    let statusCode = err.status || 500;
    let message = err.message || 'Internal Server Error';

    if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 400;
        message = 'Duplicate entry. This record already exists.';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        statusCode = 400;
        message = 'Invalid reference. The referenced record does not exist.';
    } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
        statusCode = 400;
        message = 'Invalid value. Please check your input.';
    }

    const errorResponse = {
        success: false,
        error: {
            status: statusCode,
            message: message,
            timestamp: new Date().toISOString()
        }
    };

    res.status(statusCode).json(errorResponse);
};

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const createValidationError = (message) => {
    return new AppError(message, 400);
};

const createNotFoundError = (message) => {
    return new AppError(message, 404);
};

const createUnauthorizedError = (message) => {
    return new AppError(message, 401);
};

const createForbiddenError = (message) => {
    return new AppError(message, 403);
};

module.exports = {
    errorHandler,
    AppError,
    createValidationError,
    createNotFoundError,
    createUnauthorizedError,
    createForbiddenError
};
