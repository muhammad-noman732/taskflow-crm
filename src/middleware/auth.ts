import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '@/types';
import { prisma } from '@/config/db';

// Middleware: Authenticate
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token =
    req.cookies.authToken ||
    (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded; // attach decoded payload to req.user
    return next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
};

// Middleware: Authorize
export const authorizeRole =
  (...allowedRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;

      if (!userId || !orgId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized: missing user or organization context',
        });
        return;
      }

      // Find membership
      const membership = await prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: orgId,
          },
        },
      });

      if (!membership || !allowedRoles.includes(membership.role)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: insufficient role',
        });
        return;
      }

      return next();
    } catch (error) {
      console.error('Authorization error:', error);
      // Ensure a return statement here to satisfy all code paths
      res.status(500).json({
            message: "something went wrong",
            success: false,
            error: error instanceof Error ? error.message : "Internal server error",
        });
      return;
    }
  };