import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, 'Invalid videoId');
    }

    const isLiked = await Like.find({
        $and: [ { video : videoId } , { likedBy: req.user?._id } ]
    })

    if (isLiked) {
        // If like exists, remove it (toggle off)
        await Like.findByIdAndDelete(isLiked._id);
        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Unliked the Video successfully')    
        );
    } else {
        // If like does not exist, add it (toggle on)
        const newLike = await Like.create({
            video: videoId,
            likedBy: req.user._id,
        });
        return res
        .status(201)
        .json(
            new ApiResponse(201, {}, 'Liked the video successfully')
        );
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400, 'Invalid commentId');
    }

    const isLiked = await Like.find({
        $and: [ { comment : commentId } , { likedBy: req.user?._id } ]
    })

    if (isLiked) {
        // If like exists, remove it (toggle off)
        await Like.findByIdAndDelete(isLiked._id);
        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Unliked the Comment successfully')    
        );
    } else {
        // If like does not exist, add it (toggle on)
        const newLike = await Like.create({
            comment: commentId,
            likedBy: req.user._id,
        });
        return res
        .status(201)
        .json(
            new ApiResponse(201, {}, 'Liked the Comment successfully')
        );
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400, 'Invalid tweetId');
    }

    const isLiked = await Like.find({
        $and: [ { tweet : tweetId } , { likedBy: req.user?._id } ]
    })

    if (isLiked) {
        // If like exists, remove it (toggle off)
        await Like.findByIdAndDelete(isLiked._id);
        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Unliked the Tweet successfully')    
        );
    } else {
        // If like does not exist, add it (toggle on)
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id,
        });
        return res
        .status(201)
        .json(
            new ApiResponse(201, {}, 'Liked the Tweet successfully')
        );
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(404, 'User not found')
    }

    const likedVideos = await Like.aggregate(
        [
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(userId),
                    video: { $exists: true, $ne: null },
                }
            },
            {
                $lookup: {
                    from: "videos", // Name of the Video collection
                    localField: "video",
                    foreignField: "_id",
                    as: "videoDetails",
                }
            },
            // Unwind the videoDetails array
            {
                $unwind: "$videoDetails",
            },
            // Lookup to join with the User collection to get the video's owner's details
            {
                $lookup: {
                    from: "users", // Name of the User collection
                    localField: "videoDetails.owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                },
            },
            // Unwind the ownerDetails array
            {
                $unwind: "$ownerDetails",
            },
            // Project only the required fields
            {
                $project: {
                    _id: 0, // Exclude the _id of the Like document
                    videoId: "$videoDetails._id",
                    title: "$videoDetails.title",
                    thumbnail: "$videoDetails.thumbnail",
                    videoCreatedAt: "$videoDetails.createdAt",
                    owner: {
                        _id: "$ownerDetails._id",
                        fullname: "$ownerDetails.fullname",
                        username: "$ownerDetails.username",
                        avatar: "$ownerDetails.avatar",
                    },
                },
            },
        ]
    )

    if(!likedVideos){
        throw new ApiError(500, 'Error Occured while fetching liked videos')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, likedVideos, 'Liked Videos Fetched Successfully')
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}