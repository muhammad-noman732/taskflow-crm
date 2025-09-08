"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHelper = void 0;
class ResponseHelper {
    static success(res, data, message = 'Success', statusCode = 200) {
        const response = {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        };
        return res.status(statusCode).json(response);
    }
    static error(res, message, statusCode = 500, error) {
        const response = {
            success: false,
            message,
            error,
            timestamp: new Date().toISOString()
        };
        return res.status(statusCode).json(response);
    }
    static paginated(res, data, page, limit, total, message = 'Success') {
        const totalPages = Math.ceil(total / limit);
        const response = {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
        return res.status(200).json(response);
    }
    static validationError(res, errors) {
        return this.error(res, 'Validation failed', 400, errors.join(', '));
    }
    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }
    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 403);
    }
    static notFound(res, message = 'Resource not found') {
        return this.error(res, message, 404);
    }
    static conflict(res, message = 'Resource already exists') {
        return this.error(res, message, 409);
    }
}
exports.ResponseHelper = ResponseHelper;
//# sourceMappingURL=response.js.map