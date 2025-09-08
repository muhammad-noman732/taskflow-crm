"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateRequest = void 0;
const zod_1 = require("zod");
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    error: error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', '),
                    timestamp: new Date().toISOString()
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                timestamp: new Date().toISOString()
            });
        }
    };
};
exports.validateRequest = validateRequest;
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.query);
            req.query = validatedData;
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Query validation error',
                    error: error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', '),
                    timestamp: new Date().toISOString()
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                timestamp: new Date().toISOString()
            });
        }
    };
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.params);
            req.params = validatedData;
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Parameter validation error',
                    error: error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', '),
                    timestamp: new Date().toISOString()
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                timestamp: new Date().toISOString()
            });
        }
    };
};
exports.validateParams = validateParams;
//# sourceMappingURL=validation.js.map