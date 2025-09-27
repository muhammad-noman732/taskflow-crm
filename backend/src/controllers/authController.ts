import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { prisma } from "@/config/db";
import bcrypt from "bcryptjs";
import { userSchema } from "@/schemas";
import jwt from 'jsonwebtoken'
import { sendEmail } from "@/services/emailService";



export const doSignup = async (req: Request, res: Response) => {
    try {
    // debugging
    console.log("Request body:", req.body);
    console.log("Organization name:", req.body.organizationName);
     //  Validate input

    const { username, email, password, organizationName } = req.body;

        // Validation - check required fields
        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required",
               timestamp: new Date().toISOString(),
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
                 timestamp: new Date().toISOString(),
            });
        }

        if (!organizationName) {
            return res.status(400).json({
                success: false,
                message: "Organization name is required",
                  timestamp: new Date().toISOString(),
            });
        }

        // Check if username already exists
        const existingUser = await prisma.user.findUnique({
      where: { username: username },
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
        message: "Username already exists. Please choose another name",
        timestamp: new Date().toISOString(),
            });
        }

        // Check if email already exists
        const existingEmail = await prisma.user.findUnique({
           where: { email: email },
          });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "Email already exists. Please choose another email",
                timestamp: new Date().toISOString(),
            });
        }

        // Generate slug from organization name
        const generateSlug = (name: string): string => {
            return name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single
                .trim();
        };

        const orgSlug = generateSlug(organizationName);

        // Check if organization name already exists
        const existingOrg = await prisma.organization.findUnique({
            where: { name: organizationName },
        });
        if (existingOrg) {
            return res.status(409).json({
                success: false,
                message: "Organization already exists. Please choose another name",
                timestamp: new Date().toISOString(),
            });
        }

        // Check if organization slug already exists
        const existingSlug = await prisma.organization.findUnique({
            where: { slug: orgSlug },
        });
        if (existingSlug) {
            return res.status(409).json({
                success: false,
                message: "Organization slug already exists. Please choose another name",
                timestamp: new Date().toISOString(),
            });
        }

        // Hash the password
        const hashPassword = await bcrypt.hash(password, 10);

    
        // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    
    //  Create User + Organization + Membership in one go
        const user = await prisma.user.create({
             data: {
                username,
                email,
                password: hashPassword,
                otpCode: otp,
                otpExpiry,
                memberships: {
                    create: {
                        role: "OWNER",
                        organization: {
                        create: {
                        name: organizationName,
                        slug: orgSlug,
                        // NEW PRICING DEFAULTS
                        defaultHourlyRate: 50.00,
                        currency: "USD",
                        taxRate: 0.00,
                              },
                        },
                    },
                },
             },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

     // Send OTP email
    await sendEmail(
      email,
      "Verify your account",
      `<p>Your verification code is <b>${otp}</b>. It will expire in 10 minutes.</p>`
    );

    // Generate JWT token for immediate access (production ready)
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        username: user.username,
        role: "OWNER"
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Set JWT token as HTTP-only cookie
    res.cookie('authToken', token, {
      httpOnly: true, // Prevents XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/' // Available on all routes
    });

    // Remove sensitive data from response
    const { password: _, otpCode: __, otpExpiry: ___, ...userWithoutSensitiveData } = user;

        return res.status(201).json({
            success: true,
            message: "User created successfully, please verify OTP to complete signup",
            data: userWithoutSensitiveData,
             timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during signup",
      timestamp: new Date().toISOString(),
    });
  }
};

export const doLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Find the user with their memberships and organizations
    const findUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      
      },
    });
    
    // If user not found, return 404 error
    if (!findUser) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email",
        timestamp: new Date().toISOString(),
      });
    }

    // Check if email is verified
    if (!findUser.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
        timestamp: new Date().toISOString(),
      });
    }

    // Compare the password
    const comparePassword = await bcrypt.compare(password, findUser.password);
    
    // If password doesn't match
    if (!comparePassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
        timestamp: new Date().toISOString()
      });
    }

    // Get user's primary role and organization (first membership)
    const primaryMembership = findUser.memberships[0];
    const primaryRole = primaryMembership?.role || 'MEMBER';
    const currentOrganizationId = primaryMembership?.organizationId;

    // If user found and password correct, create JWT token
    const token = jwt.sign(
      { 
        userId: findUser.id, 
        email: findUser.email,
        username: findUser.username,
        role: primaryRole,
        organizationId: currentOrganizationId
      },
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '7d' } // Token expires in 7 days
    );

    // Set JWT token as HTTP-only cookie
    res.cookie('authToken', token, {
      httpOnly: true, // Prevents XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/' // Available on all routes
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = findUser;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutPassword
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login",
      timestamp: new Date().toISOString()
    });
  }
};



export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        timestamp: new Date().toISOString(),
      });
    }

    // Check if OTP matches and is not expired
    if (!user.otpCode || user.otpCode !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code",
        timestamp: new Date().toISOString(),
      });
    }

    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
        timestamp: new Date().toISOString(),
      });
    }

    // Update user as verified and clear OTP
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiry: null,
      },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    // Generate new JWT token with verified status
    const token = jwt.sign(
      { 
        userId: updatedUser.id, 
        email: updatedUser.email,
        username: updatedUser.username,
        role: "OWNER"
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Set JWT token as HTTP-only cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: userWithoutPassword,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during OTP verification",
      timestamp: new Date().toISOString(),
    });
  }
};

export const doLogout = async (req: Request, res: Response) => {
  try {
    // Clear the authToken cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
    console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
      message: "Internal server error during logout",
            timestamp: new Date().toISOString()
        });
    }
};