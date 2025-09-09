import { z } from 'zod';

// User schemas

export const userSchema = z.object({
  username: z.string().min(4, "Username must be at least 4 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(3, "Organization name must be at least 3 characters"),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});


export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits')
});

// Invitation schemas
export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'CLIENT'], {
    message: 'Role must be OWNER, ADMIN, MANAGER, MEMBER, or CLIENT'
  })
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional()
});


export const updateUserSchema = userSchema.partial().omit({ password: true });

// Type inference from schemas
export type InviteUserRequest = z.infer<typeof inviteUserSchema>;
export type AcceptInvitationRequest = z.infer<typeof acceptInvitationSchema>;

// Query schemas
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default(1),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
});

// Parameter schemas
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
});


// CRM specific schemas

// project schema 
export const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description :z.string()
    .min(10, "Description should be a minimum of 10 characters")
    .max(300, "Description should be at most 300 characters"),
  deadline: z.string().datetime().optional(),
  clientId: z.string().uuid("Invalid client ID format").optional()
});

// client schema
export const clientSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters"),
  email: z.string().email("Invalid email format").optional(),
  company: z.string().optional(),
  type: z.enum(['CRM', 'INVITED']).default('CRM'),
  userId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// invited client schema (for linking existing CLIENT users)
export const invitedClientSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  name: z.string().min(2, "Client name must be at least 2 characters").optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});


export const customerSchema = z.object({
  name: z.string().min(3, 'Customer name must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  deadline: z.string().datetime().optional(),
  projectId: z.string().uuid('Invalid project ID format'),
  assigneeMembershipIds: z.array(z.string().uuid('Invalid assignee ID format')).optional()
});

// Type inference from schemas
export type User = z.infer<typeof userSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type Client = z.infer<typeof clientSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type Task = z.infer<typeof taskSchema>;
