import { 
    createComment, 
    getTaskComments, 
    getProjectComments, 
    updateComment, 
    deleteComment 
} from '@/controllers/commentController'
import { authenticateToken } from '@/middleware/auth'
import { validateRequest, validateParams } from '@/middleware/validation'
import { commentSchema, updateCommentSchema, idParamSchema } from '@/schemas'
import express from 'express'

const commentRouter = express.Router()

// Create comment
commentRouter.post("/", validateRequest(commentSchema), authenticateToken, createComment)

// Get task comments
commentRouter.get("/task/:id", validateParams(idParamSchema), authenticateToken, getTaskComments)

// Get project comments  
commentRouter.get("/project/:id", validateParams(idParamSchema), authenticateToken, getProjectComments)

// Update comment
commentRouter.put("/:id", validateParams(idParamSchema), validateRequest(updateCommentSchema), authenticateToken, updateComment)

// Delete comment
commentRouter.delete("/:id", validateParams(idParamSchema), authenticateToken, deleteComment)

export default commentRouter