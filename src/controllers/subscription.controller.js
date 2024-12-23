import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const findSub = await Subscription.findOne(
        { 
            $and: [{ subscriber: (req.user?._id) }, { channel: channelId }] 
        }
    )

    if (!findSub) {
        const subscribed = await Subscription.create(
            {
                subscriber: req.user?._id,
                channel: channelId
            }
        )
        if (!subscribed) {
            throw new ApiError(400, "Error while Subscribing")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200, subscribed, "Subscribed to channel Successfully")
        )
    }
        
    const unSub = await Subscription.findByIdAndDelete(findSub._id)
    if (!unSub) {
        throw new ApiError(400, "Error while unsubscribing")
    }
        
    return res
    .status(200)
    .json(
        new ApiResponse(200, unSub, "UnSubscribed from Channel Successfully")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const subscribers = await Subscription.aggregate(
        [
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: 'subscriber',
                    as: "subscriberDetails",
                    pipeline: [
                        {
                            $project: {
                                fullname: 1,
                                username: 1,
                                avatar: 1,
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$subscriberDetails", // Flatten the subscriberDetails array
            },
            {
                $project: {
                    _id: "$subscriberDetails._id",
                    fullname: "$subscriberDetails.fullname",
                    username: "$subscriberDetails.username",
                    avatar: "$subscriberDetails.avatar",
                },
            },
        ]
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers, 'Subscribers Fetched Successfully')
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const subscribedChannels = await Subscription.aggregate(
        [
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(subscriberId) 
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: 'channel',
                    as: "subscribedChannelDetails",
                    pipeline: [
                        {
                            $project: {
                                fullname: 1,
                                username: 1,
                                avatar: 1,
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    _id: "$subscribedChannelDetails._id",
                    fullname: "$subscribedChannelDetails.fullname",
                    username: "$subscribedChannelDetails.username",
                    avatar: "$subscribedChannelDetails.avatar",
                },
            },
        ]
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribedChannels, 'Subscribed Channels Fetched Successfully')
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}