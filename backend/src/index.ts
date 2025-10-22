import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import http from   'http'
import { Server } from 'socket.io';


// import routes
import authRoutes from '@/routes/authRoutes';
import invitationRoutes from '@/routes/invitationRoutes';
import projectRouter from './routes/projectRoutes';
import clientRoutes from './routes/clientRoutes';
import taskRoutes from './routes/taskRoutes';
import projectMemberRoutes from './routes/projectMemberRoutes';
import commentRouter from './routes/commentsRoutes';
import labelRoutes from './routes/labelRoutes';
import taskLabelRoutes from './routes/taskLabelRoutes';
import attachmentRoutes from './routes/attachmentRoutes';
import contactRoutes from './routes/contactRoutes';
import timeEntryRoutes from './routes/timeEntryRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import paymentRoutes from './routes/paymentRoutes';
import channelRoutes from './routes/channelRoutes';
import channelMemberRoutes from './routes/channelMemberRoutes';
import messageRoutes from './routes/messageRoutes';
import { Socket } from 'dgram';

// Load environment variables
dotenv.config();

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173/'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;


io.on("connection" ,(socket)=>{
  console.log("connected with" , socket.id);
  socket.on("disconnect" , ()=>{
     console.log("disconnect");
  })
   socket.on('chat_message',(message , room)=>{
       console.log("message of chat" , message)
      //  this io.emit()will send the message to all include the sender so this is not a good
      //  io.emit("chat_message_recieved" , message)
      if(room ===""){
        // this will send message to all receiving cliend except sender
         socket.broadcast.emit("chat_message_recieved" , message)
      }
      else{
        // this will send message to only the user in room(1 to 1 chat)
        socket.to(room).emit("chat_message_recieved" , message)
      }
   })

  //  this is joining the room . kind of group chat 
   socket.on("join-room", (room, cb)=>{
      socket.join(room)
      cb('joined' , room)
   })

 
  
})

// Security middleware (for xss attacks)
app.use(helmet());


// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Compression middleware (to send the response in compress way to cleint from server )
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Health check endpoint . mostly  used in production , aws . azure check this  if some issue
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'TaskFlow CRM API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/projects', projectRouter);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/project-members', projectMemberRoutes);
app.use('/api/comments', commentRouter);
app.use('/api/labels', labelRoutes);
app.use('/api/task-labels', taskLabelRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/channels', channelMemberRoutes);
app.use('/api/channels', messageRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
