# TaskFlow CRM

A modern, multi-tenant Customer Relationship Management (CRM) system built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Features

### **Multi-Tenant Architecture**
- Multiple organizations in one instance
- Isolated data per organization
- Organization switching
- Role-based access control

### **Authentication & Authorization**
- JWT-based authentication
- Email verification with OTP
- Role-based permissions (OWNER, ADMIN, MANAGER, MEMBER, CLIENT)
- Secure invitation system

### **Core CRM Features**
- Project management
- Task tracking and assignment
- Client management
- Team collaboration
- Real-time notifications

### **Enterprise Features**
- Multi-organization support
- Scalable architecture
- RESTful API
- Comprehensive logging

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT, bcryptjs
- **Email**: SendGrid
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate limiting

## 📋 Prerequisites

- Node.js (v18+)
- PostgreSQL
- SendGrid account (for email)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/taskflow-crm.git
   cd taskflow-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your database and SendGrid credentials
   ```

4. **Database setup**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

### **Authentication**
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-otp` - Email verification

### **Organizations**
- `POST /api/invitations/invite` - Send invitation
- `POST /api/invitations/accept` - Accept invitation
- `GET /api/invitations` - List invitations

### **Projects**
- `POST /api/projects/createProject` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/update/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## 🏗️ Architecture

```
src/
├── controllers/     # Route handlers
├── middleware/      # Authentication, validation
├── routes/         # API routes
├── schemas/        # Zod validation schemas
├── services/       # Business logic
├── types/          # TypeScript types
└── config/         # Database configuration
```

## 🔐 Security Features

- JWT token authentication
- HTTP-only cookies
- Password hashing with bcrypt
- Input validation with Zod
- Rate limiting
- CORS protection
- Helmet security headers

## 🌟 Multi-Tenancy

TaskFlow CRM is designed for multiple organizations:

- **Isolated Data**: Each organization's data is completely separate
- **Role Management**: Different roles per organization
- **Organization Switching**: Users can belong to multiple organizations
- **Scalable**: Built to handle thousands of organizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@taskflow-crm.com or create an issue in this repository.

---

**Built with ❤️ for modern teams and organizations**
