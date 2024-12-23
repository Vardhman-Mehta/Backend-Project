import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    if(!content){
        throw new ApiError(400, 'Please enter content')
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    if(!tweet){
        throw new ApiError(500, 'Error occured while tweeting')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, 'Tweeted successfully')
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.params?.userId;

    const tweets = await Tweet.find({owner:userId})

    if (tweets.length === 0 ) {
        throw new ApiError(404,"No tweets found")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        tweets,
        "Tweets Fetched Successfully"
    ))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { content } = req.body

    if (!content) {
        throw new ApiError(
            400,
            "Please fill the Required fields"
        )
    }

    const tweet = await Tweet.findById(req.params?.tweetId)
    if(!tweet){
        throw new ApiError(
            400,
            "tweet does not exist"
        )
    }

    if (!((tweet?.owner).equals(req.user?._id))){
        throw new ApiError(
            400,
            "You are not Allowed to Change the Tweet"
        )
    }
        
    const newTweet = await Tweet.findByIdAndUpdate(
        tweet._id,
        {
            $set: {
                content,
            }
        },
        { new : true }
    )

    return res.status(200).json(
        new ApiResponse(200, newTweet, "Updated Tweet")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const tweetId = req.params?.tweetId
        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400,"Invalid Tweeet Id")
        }
        const tweet = await Tweet.findById(tweetId)
        if (!tweet) {
            throw new ApiError(400,"No such Tweet found")
        }
        if (!((tweet.owner).equals(req.user?._id))){
            throw new ApiError(400,"You cannot delete this tweet")
        }
        const response = await Tweet.findByIdAndDelete(tweet._id)

        if (!response) {
            throw new ApiError(
                400,
                "Error While Deleting the data"
            )
        }
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Deleted the Tweet"
        ))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}