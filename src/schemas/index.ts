
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
  status: z.enum(["ACTIVE" , "IN_PROGRES" , "COMPLETED"]).default("ACTIVE"),
  startDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  clientId: z.string().uuid("Invalid client ID format").optional(),
  
  // NEW PRICING FIELDS
  pricingType: z.enum(["HOURLY", "FIXED", "RETAINER"]).default("HOURLY"),
  fixedPrice: z.string().transform(Number).pipe(z.number().positive("Fixed price must be positive")).optional(),
  hourlyRate: z.string().transform(Number).pipe(z.number().positive("Hourly rate must be positive")).optional(),
  estimatedHours: z.string().transform(Number).pipe(z.number().int().positive("Estimated hours must be positive")).optional(),
  budget: z.string().transform(Number).pipe(z.number().positive("Budget must be positive")).optional()
});

// project update schema (all fields optional)
export const updateProjectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters").optional(),
  description: z.string()
    .min(10, "Description should be a minimum of 10 characters")
    .max(300, "Description should be at most 300 characters").optional(),
  status: z.enum(["ACTIVE" , "IN_PROGRES" , "COMPLETED"]).optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  clientId: z.string().uuid("Invalid client ID format").optional(),
  
  // NEW PRICING FIELDS
  pricingType: z.enum(["HOURLY", "FIXED", "RETAINER"]).optional(),
  fixedPrice: z.string().transform(Number).pipe(z.number().positive("Fixed price must be positive")).optional(),
  hourlyRate: z.string().transform(Number).pipe(z.number().positive("Hourly rate must be positive")).optional(),
  estimatedHours: z.string().transform(Number).pipe(z.number().int().positive("Estimated hours must be positive")).optional(),
  budget: z.string().transform(Number).pipe(z.number().positive("Budget must be positive")).optional()
});

// client schema
export const clientSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters"),
  email: z.string().email("Invalid email format").optional(),
  company: z.string().optional(),
  type: z.enum(['CRM', 'INVITED']).default('CRM'),
  userId: z.string().uuid().optional(),
  notes: z.string().optional(),
  // NEW PRICING FIELD
  customHourlyRate: z.string().transform(Number).pipe(z.number().positive("Custom hourly rate must be positive")).optional(),
});

// client update schema (all fields optional)
export const updateClientSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email format").optional(),
  company: z.string().optional(),
  type: z.enum(['CRM', 'INVITED']).optional(),
  userId: z.string().uuid().optional(),
  notes: z.string().optional(),
  // NEW PRICING FIELD
  customHourlyRate: z.string().transform(Number).pipe(z.number().positive("Custom hourly rate must be positive")).optional(),
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
  description: z.string(),
  priority: z.enum(["Low" ,"MEDIUM" , "HIGH"]).default("HIGH"),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE' ,"BLOCKED"]).default('TODO'),
  dueDate: z.string().datetime(),
  projectId: z.string().uuid('Invalid project ID format'),
  assignees: z.array(z.string().uuid('Invalid assignee ID format')).optional()
});

// Project Member schemas
export const addProjectMemberSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format'),
  memberId: z.string().uuid('Invalid member ID format'),
  role: z.enum(['PM', 'COLLABORATOR', 'VIEWER', 'CLIENT_VIEWER'], {
    message: 'Role must be PM, COLLABORATOR, VIEWER, or CLIENT_VIEWER'
  })
});

export const projectMemberParamsSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format'),
  memberId: z.string().uuid('Invalid member ID format')
});

// comment schema 
export const commentSchema = z.object({
    body: z.string().min(1, "Comment body is required").max(1000, "Maximum 1000 characters are allowed"),
    projectId: z.string().uuid("Invalid project ID format").optional(),
    taskId: z.string().uuid("Invalid task ID format").optional()
}).refine(
    (data) => data.projectId || data.taskId,
    {
        message: "Either projectId or taskId must be provided",
        path: ["projectId", "taskId"]
    }
)

// update comment schema (only body can be updated)
export const updateCommentSchema = z.object({
    body: z.string().min(1, "Comment body is required").max(1000, "Maximum 1000 characters are allowed")
})

// label schema
export const labelSchema = z.object({
    name: z.string().min(1, "Label name is required").max(50, "Label name must be less than 50 characters"),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color format").optional()
})

// update label schema
export const updateLabelSchema = z.object({
    name: z.string().min(1, "Label name is required").max(50, "Label name must be less than 50 characters").optional(),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color format").optional()
}).refine(
    (data) => data.name || data.color,
    {
        message: "At least one field (name or color) must be provided",
        path: ["name", "color"]
    }
)


// Type inference from schemas
export type User = z.infer<typeof userSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type Client = z.infer<typeof clientSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type Task = z.infer<typeof taskSchema>;
export type AddProjectMemberRequest = z.infer<typeof addProjectMemberSchema>;
export type ProjectMemberParams = z.infer<typeof projectMemberParamsSchema>;

// task label schemas
export const taskLabelSchema = z.object({
    taskId: z.string().uuid("Invalid task ID format"),
    labelId: z.string().uuid("Invalid label ID format")
});

export const bulkTaskLabelSchema = z.object({
    taskId: z.string().uuid("Invalid task ID format"),
    labelIds: z.array(z.string().uuid("Invalid label ID format")).min(1, "At least one label ID is required")
});

export const taskLabelParamsSchema = z.object({
    taskId: z.string().uuid("Invalid task ID format"),
    labelId: z.string().uuid("Invalid label ID format")
});

export const taskParamsSchema = z.object({
    taskId: z.string().uuid("Invalid task ID format")
});

export type TaskLabelRequest = z.infer<typeof taskLabelSchema>;
export type BulkTaskLabelRequest = z.infer<typeof bulkTaskLabelSchema>;
export type TaskLabelParams = z.infer<typeof taskLabelParamsSchema>;
export type TaskParams = z.infer<typeof taskParamsSchema>;

// attachment schemas
export const attachmentSchema = z.object({
    projectId: z.string().uuid("Invalid project ID format").optional(),
    taskId: z.string().uuid("Invalid task ID format").optional()
}).refine(
    (data) => data.projectId || data.taskId,
    {
        message: "Either projectId or taskId must be provided",
        path: ["projectId", "taskId"]
    }
);

export const updateAttachmentSchema = z.object({
    fileName: z.string().min(1, "Filename is required").max(255, "Filename too long").optional()
});

export const attachmentParamsSchema = z.object({
    id: z.string().uuid("Invalid attachment ID format")
});

export const taskAttachmentParamsSchema = z.object({
    id: z.string().uuid("Invalid task ID format")
});

export const projectAttachmentParamsSchema = z.object({
    id: z.string().uuid("Invalid project ID format")
});

export type AttachmentRequest = z.infer<typeof attachmentSchema>;
export type UpdateAttachmentRequest = z.infer<typeof updateAttachmentSchema>;
export type AttachmentParams = z.infer<typeof attachmentParamsSchema>;
export type TaskAttachmentParams = z.infer<typeof taskAttachmentParamsSchema>;
export type ProjectAttachmentParams = z.infer<typeof projectAttachmentParamsSchema>;

// Contact schemas
export const createContactSchema = z.object({
  clientId: z.string().uuid("Invalid client ID format"),
  name: z.string().min(2, "Contact name must be at least 2 characters").max(100, "Contact name too long"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20, "Phone number too long").optional().or(z.literal("")),
  position: z.string().min(2, "Position must be at least 2 characters").max(100, "Position too long").optional().or(z.literal("")),
  isPrimary: z.boolean().default(false)
});

export const updateContactSchema = z.object({
  name: z.string().min(2, "Contact name must be at least 2 characters").max(100, "Contact name too long").optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20, "Phone number too long").optional().or(z.literal("")),
  position: z.string().min(2, "Position must be at least 2 characters").max(100, "Position too long").optional().or(z.literal("")),
  isPrimary: z.boolean().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update",
    path: ["name", "email", "phone", "position", "isPrimary"]
  }
);

export const contactParamsSchema = z.object({
  id: z.string().uuid("Invalid contact ID format")
});

export const clientContactsParamsSchema = z.object({
  clientId: z.string().uuid("Invalid client ID format")
});

export type CreateContactRequest = z.infer<typeof createContactSchema>;
export type UpdateContactRequest = z.infer<typeof updateContactSchema>;
export type ContactParams = z.infer<typeof contactParamsSchema>;
export type ClientContactsParams = z.infer<typeof clientContactsParamsSchema>;

// Time Entry schemas
export const startTimerSchema = z.object({
  taskId: z.string().uuid("Invalid task ID format"),
  notes: z.string().max(500, "Notes too long").optional(),
  billable: z.boolean().default(true)
});

export const stopTimerSchema = z.object({
  timeEntryId: z.string().uuid("Invalid time entry ID format")
});

export const createTimeEntrySchema = z.object({
  taskId: z.string().uuid("Invalid task ID format"),
  startedAt: z.string().datetime("Invalid start date format"),
  endedAt: z.string().datetime("Invalid end date format"),
  notes: z.string().max(500, "Notes too long").optional(),
  billable: z.boolean().default(true)
}).refine(
  (data) => new Date(data.endedAt) > new Date(data.startedAt),
  {
    message: "End time must be after start time",
    path: ["endedAt"]
  }
);

export const updateTimeEntrySchema = z.object({
  startedAt: z.string().datetime("Invalid start date format").optional(),
  endedAt: z.string().datetime("Invalid end date format").optional().or(z.literal("")),
  notes: z.string().max(500, "Notes too long").optional(),
  billable: z.boolean().optional()
}).refine(
  (data) => {
    if (data.startedAt && data.endedAt && data.endedAt !== "") {
      return new Date(data.endedAt) > new Date(data.startedAt);
    }
    return true;
  },
  {
    message: "End time must be after start time",
    path: ["endedAt"]
  }
).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update",
    path: ["startedAt", "endedAt", "notes", "billable"]
  }
);

export const timeEntryParamsSchema = z.object({
  id: z.string().uuid("Invalid time entry ID format")
});

export const timeEntryQuerySchema = z.object({
  taskId: z.string().uuid("Invalid task ID format").optional(),
  projectId: z.string().uuid("Invalid project ID format").optional(),
  userId: z.string().uuid("Invalid user ID format").optional(),
  startDate: z.string().datetime("Invalid start date format").optional(),
  endDate: z.string().datetime("Invalid end date format").optional(),
  billable: z.enum(['true', 'false']).optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
);

export type StartTimerRequest = z.infer<typeof startTimerSchema>;
export type StopTimerRequest = z.infer<typeof stopTimerSchema>;
export type CreateTimeEntryRequest = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryRequest = z.infer<typeof updateTimeEntrySchema>;
export type TimeEntryParams = z.infer<typeof timeEntryParamsSchema>;
export type TimeEntryQuery = z.infer<typeof timeEntryQuerySchema>;



