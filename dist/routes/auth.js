"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("@/middleware/validation");
const schemas_1 = require("@/schemas");
const response_1 = require("@/utils/response");
const router = (0, express_1.Router)();
router.post('/register', (0, validation_1.validateRequest)(schemas_1.userSchema), (req, res) => {
    const { email, password, firstName, lastName, role } = req.body;
    return response_1.ResponseHelper.success(res, {
        message: 'User registered successfully',
        user: { email, firstName, lastName, role }
    }, 'Registration successful', 201);
});
router.post('/login', (0, validation_1.validateRequest)(schemas_1.loginSchema), (req, res) => {
    const { email, password } = req.body;
    return response_1.ResponseHelper.success(res, {
        message: 'Login successful',
        user: { email }
    }, 'Login successful');
});
exports.default = router;
//# sourceMappingURL=auth.js.map