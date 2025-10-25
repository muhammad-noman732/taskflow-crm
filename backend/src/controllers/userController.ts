import { prisma } from "@/config/db"
import { Request , Response } from "express"

export const getCurrentUser = async(req:Request , res:Response)=>{
    try {
        const user = await prisma.user.findUnique({
            where:{
                id : req.user?.userId
            },
            include:{
                memberships:{
                    select:{
                        organization:true,
                    }
                }
            }
        })

        return res.status(200).json({
            message:"User fetched successfully",
            success: true,
            data: user,
            timeStamps: new Date().toISOString()
        })
    } catch (error) {
         return res.status(500).json({
            message:"eroor in fetching user",
            success: false,
            error: error instanceof Error ? error.message :"Internal Server Error",
            timeStamps: new Date().toISOString()
        })
    }
}