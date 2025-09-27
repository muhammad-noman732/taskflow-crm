# TaskFlow CRM

A comprehensive CRM system for project management, client management, time tracking, invoicing, and real-time team collaboration.

## 🚀 Project Structure

```
TaskFlow CRM1/
├── backend/          # Node.js/Express API with Prisma ORM
│   ├── src/          # Source code
│   ├── prisma/       # Database schema and migrations
│   ├── package.json  # Backend dependencies
│   └── README.md     # Backend setup instructions
└── frontend/         # Next.js React application (coming soon)
    ├── src/          # Frontend source code
    ├── components/   # React components
    ├── pages/        # Next.js pages
    └── package.json  # Frontend dependencies
```

## 🎯 Features

### ✅ Completed (Backend)
- **Authentication & Authorization** - JWT-based with role management
- **Project Management** - Full CRUD with team collaboration
- **Task Management** - Kanban-style with dependencies and labels
- **Client & Contact Management** - Comprehensive client database
- **Time Tracking** - Manual and timer-based time entry
- **Invoicing & Billing** - Automated invoice generation with payment tracking
- **Real-time Chat System** - Channel-based messaging with Socket.io
- **File Management** - Document upload and organization
- **Team Collaboration** - Role-based permissions and notifications

### 🚧 In Progress
- **Frontend Development** - Modern React/Next.js interface
- **Advanced Socket.io Features** - Real-time notifications and presence
- **Mobile Responsiveness** - Cross-device compatibility

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.io
- **Validation**: Zod schemas
- **File Storage**: Cloudinary
- **Email**: SendGrid

### Frontend (Planned)
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn/ui
- **State Management**: React Query
- **Real-time**: Socket.io Client

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Configure your environment variables
npm run prisma:migrate
npm run dev
```

### Frontend Setup (Coming Soon)
```bash
cd frontend
npm install
npm run dev
```

## 📚 API Documentation

The backend provides a comprehensive REST API with the following endpoints:

- **Authentication**: `/api/auth/*`
- **Projects**: `/api/projects/*`
- **Tasks**: `/api/tasks/*`
- **Clients**: `/api/clients/*`
- **Time Tracking**: `/api/time-entries/*`
- **Invoicing**: `/api/invoices/*`
- **Chat**: `/api/channels/*`
- **And more...**

## 🔧 Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Cloudinary account (for file uploads)
- SendGrid account (for emails)

### Environment Variables
See `backend/env.example` for required environment variables.

## 🏆 Project Status

This is a **production-ready CRM system** built for learning and portfolio purposes. It demonstrates:

- **Full-stack development** skills
- **Modern web technologies**
- **Database design** and optimization
- **Real-time communication**
- **Security best practices**
- **Scalable architecture**

## 📝 License

This project is for educational and portfolio purposes.

## 👨‍💻 Author

**Noman** - Full Stack Developer

---

*Built with ❤️ for learning and professional growth*
