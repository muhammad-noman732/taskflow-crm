// import { prisma } from '@/config/db';
// import {Request , Response} from 'express'

// // model Notification {
// //   id        String @id @default(uuid())
// //   user      User @relation(fields: [userId], references: [id])
// //   userId    String
// //   type      String
// //   data      Json
// //   readAt    DateTime?
// //   createdAt DateTime @default(now())
// // }


// // 3. Notification Controller 
// // Why: User engagement and alerts

// // createNotification - Send notification
// export const createNotification = async(req:Request , res:Response)=>{
//     try {
//                 const userId = req.user?.userId;
//                 const organizationId = req.user?.organizationId;
         
//                 // 1. Authentication check
//                 if (!userId || !organizationId) {
//                     return res.status(401).json({
//                         success: false,
//                         message: "User not authenticated or no organization context",
//                         timestamp: new Date().toISOString()
//                      });
//                 }
         
//                 // 2. Validate membership
//                 const membership = await prisma.organizationMembership.findUnique({
//                     where: {
//                         userId_organizationId: {
//                             userId: userId,
//                             organizationId: organizationId
//                         }
//                     }
//                 });
               
//                 if (!membership) {
//                     return res.status(403).json({
//                         success: false,
//                         message: "Not a member of this organization",
//                         timestamp: new Date().toISOString()
//                     });
//                 } 

//                 // create notification
//                 const 

//             } catch (error) {

//             }
//         }


// // getUserNotifications - Get user's notifications
// // markAsRead - Mark notification as read
// // deleteNotification - Remove notification
// // getUnreadCount - Count unread notifications


