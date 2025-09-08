// Common types for the application

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  organizationId: string
  role?: string; // Optional since user might have multiple roles
  iat: number;
  exp: number;
}

// Express Request extension for authenticated routes
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
