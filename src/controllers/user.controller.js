import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from '../models/user.model.js';
import uploadOnCloudinary, {deleteFromCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        await user.updateOne({ refreshToken });
        // user.refreshToken = refreshToken;
        // await user.save({ validateBeforeSave : false })

        return {accessToken, refreshToken}
    }
    catch(error){
        throw new ApiError(500, 'Something went wrong while generating refresh and access token')
    }
}

const registerUser = asyncHandler( async (req, res) => {
    const {fullname, username, email, password} = req.body;

    // check no fields are empty
    if(
        [fullname, username, email, password].some((field) => 
            field?.trim() === ""
        )
    ){
        throw new ApiError(400, 'All fields are required');
    }

    // check that it is non-existing user
    const existedUser = await User.findOne({
        $or : [ { email } , { username } ]
    })

    if(existedUser){
        throw new ApiError(409, 'User with email or username already exists');
    }

    // multer give req.files
    const avatarLocalPath = req.files?.avatar[0]?.path // if there is req.files and in that, 
                                                       // if there is avatar's object, then get local path from that object
    
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, 'avatar image is required')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, 'avatar image is required')
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, 'Something went wrong while registering user')
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered succefully !")
    )
} )


// login user function

const loginUser = asyncHandler(async (req, res) => {

    // steps : 
    // - req.body -> data
    // - username or email
    // - find the user
    // - check the password
    // - generate access and refresh token
    // - send cookie

    const {email, username, password} = req.body;

    if(!username && !email){
        throw new ApiError(400, 'username or email is required')
    }

    const user = await User.findOne({
        $or : [{ username } , { email }]
    })

    if(!user){
        throw new ApiError(404, 'User does not exist')
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, 'Password is incorrect')
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshPassword")

    const options = {       // options for cookie
        httpOnly: true,     // Purpose: It ensures that the cookie is only accessible via HTTP(S) 
        // requests and cannot be accessed or manipulated through client-side JavaScript.
        secure: true,       // It ensures that the cookie is only sent over secure HTTPS connections.

        // Using both properties together makes the cookie:
        // Unreadable and unmodifiable from client-side JavaScript (httpOnly).
        // Sent only over encrypted connections (secure).
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in succeefully"
        )
    )
})


// logout user function

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate( req.user._id , { $set : {refreshToken: undefined} } , { new : true })

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    )
})


// refresh, access and refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id) 

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, 'Invalid Old Password')
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password Changed Successfully")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Current User fetched Successfully")
    )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullname, email} = req.body

    if(!(fullname && email)){
        throw new ApiError(400, 'All Fields are required')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, 'Account Details Updated Successfully')
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, 'Avatar file is missing') 
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar || !avatar.url){
        throw new ApiError(400, 'Error while uploading avatar')
    }

    const userOld = await User.findById(req.user._id);
    const oldAvatarUrl = userOld.avatar;
    try{
        await deleteFromCloudinary(oldAvatarUrl);
    }
    catch{
        console.log('Error occured while deleting the old avatar')
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true,
            select: "-password"
        }
    )

    res.
    status(200)
    .json(
        new ApiResponse(200, user, 'Avatar updated successfully')
    )
})

const updateUsercoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, 'Cover Image file is missing') 
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage || !coverImage.url){
        throw new ApiError(400, 'Error while uploading Cover Image')
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true,
            select: "-password"
        }
    )

    res
    .status(200)
    .json(
        new ApiResponse(200, user, 'Cover Image updated successfully')
    )
})


// get user profile from it's url

const getUserChannelProfile = asyncHandler( async (req, res) => {
    const {username} = req.params

    if(!(username?.trim())){
        throw new ApiError(400, 'username is missing')
    }

    // to find number of subscribers of this channel
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            fullname: 1,
            username: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1,
            createdAt: 1
        }
    ])

    if(!channel?.length()){
        throw new ApiError(404, 'Channel does not exist')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], 'Channel fetched successfully')
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUsercoverImage,
    getUserChannelProfile
};