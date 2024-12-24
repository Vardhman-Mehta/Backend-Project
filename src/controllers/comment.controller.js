import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id");
    }

    const comments = await Comment.aggregate(
        [
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "owner",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullname: 1,
                                avatar: 1,
                                _id: 1,
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "likes",
                    foreignField: "comment",
                    localField: "_id",
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
                    owner_id: "owner._id",
                    username: "owner.username",
                    fullname: "owner.fullname",
                    avatar: "owner.avatar",
                    content: 1,
                    likesCount: 1
                }
            },
            {
                $skip: (page - 1) * limit,
            },
    
            {
                $limit: parseInt(limit)
            }
        ]
    )

    if(!comments){
        throw new ApiError(500, 'Error Occured While Fetching Comments')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, comments, 'Comments Fetched Successfully')
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const videoId = req.params;
    const userId = req.user?._id;
    const {content} = req.body;

    if(!content) {
        throw new ApiError(400, "Content is required");
    }

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    });

    if(!comment) {
        throw new ApiError(500, "Error while adding comment");
    }

    return res.
    status(200).
    json(
        new ApiResponse(200, comment, "Comment added successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const {content} = req.body;
    const {commentId} = req.params;

    if(!content) {
        throw new ApiError(400, "content is required");
    }

    if(!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(500, "Comment not found");
    }

    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            401,
            "You do not have permission to update this comment"
        );
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {content},
        },
        {
            new: true
        }
    );

    if(!updatedComment) {
        throw new ApiError(500, "Error while updating the comment");
    }

    return res.
    status(200).
    json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const commentId = req.params;

    if(!commentId || isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const comment = await Comment.findById(commentId);
    if(!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(400, "Error while deleting comment");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "comment successfully deleted")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }