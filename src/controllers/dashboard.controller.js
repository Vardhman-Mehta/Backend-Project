import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId = req.user._id

    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ])

    const totalLikes = await Video.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    foreignField: "video",
                    localField: "_id",
                    as: "Likes"
                }
            },
            {
                $project: {
                    likesCount: { $size: "$Likes" },
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$likesCount" },
                }
            }
        ]
    )

    const totalSubscribers = await Subscription.find({
        channel: userId
    }).countDocuments()

    const result = {
        totalViews: videoStats[0]?.totalViews || 0,
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalSubscribers,
        totalLikes: totalLikes[0]?.total || 0,
    };

    return res
    .status(200)
    .json(
        new ApiResponse(200, result, 'Channel Stats Fetched Successfully')
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const videos = await Video.aggregate([
        {
            $match: {
                owner: req.user?._id,
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $project: {
                _id: 1,
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                createdAt: 1,
                owner: 1,
                views: 1,
                likesCount: 1,
                isPublished: 1,
            }
        }
    ]);


    if (!videos) {
        throw new ApiError(404, "Error Occured While Fetching Videos");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
})

export {
    getChannelStats, 
    getChannelVideos
    }