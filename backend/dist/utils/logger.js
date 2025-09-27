"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = exports.requestLogger = void 0;
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            timestamp: new Date().toISOString()
        };
        console.log(JSON.stringify(logData));
    });
    next();
};
exports.requestLogger = requestLogger;
const errorLogger = (err, req, res, next) => {
    const errorLog = {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        query: req.query,
        params: req.params,
        user: req.user,
        timestamp: new Date().toISOString()
    };
    console.error(JSON.stringify(errorLog));
    next(err);
};
exports.errorLogger = errorLogger;
//# sourceMappingURL=logger.js.map