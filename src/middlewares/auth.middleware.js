import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export const verifyJWT = asyncHandler( async (req, _, next) => {
    try{
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        // frontend is sending the access token in a cookie, then extract from cookie,
        // otw, extract them from the header of req.

        if(!token){
            throw new ApiError(401, "Unauthorized Request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if(!user){
            throw new ApiError(401, "Invalid access token")
        }

        req.user = user     // adding user field in the req. so that in further op, it can access id of it.

        next()
    }
    catch(error){
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})