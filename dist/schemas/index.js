"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskSchema = exports.customerSchema = exports.idParamSchema = exports.paginationSchema = exports.updateUserSchema = exports.loginSchema = exports.userSchema = void 0;
const zod_1 = require("zod");
exports.userSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters'),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters'),
    role: zod_1.z.enum(['ADMIN', 'MANAGER', 'USER']).optional().default('USER')
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required')
});
exports.updateUserSchema = exports.userSchema.partial().omit({ password: true });
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).default(1),
    limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).default(10),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc')
});
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid ID format')
});
exports.customerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Customer name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email format'),
    phone: zod_1.z.string().optional(),
    company: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional()
});
exports.taskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Task title is required'),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    dueDate: zod_1.z.string().datetime().optional(),
    assignedTo: zod_1.z.string().uuid().optional(),
    customerId: zod_1.z.string().uuid().optional()
});
//# sourceMappingURL=index.js.map