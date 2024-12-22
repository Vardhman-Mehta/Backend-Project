import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import uploadOnCloudinary, { deleteFromCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const videos = await Video.aggregate([
        {
          $match: {
            $text: { $search: query } // Perform text search on the title field
          }
        },
        {
          $project: {
            score: { $meta: "textScore" }, // Include relevance score
            title: 1,
            views: 1,
            owner: 1,
            duration: 1,
            thumbnail: 1,
            videoFile: 1,
          }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: "$ownerDetails", // Unwinds the ownerDetails array, extracting the first item
                preserveNullAndEmptyArrays: true // If no matching owner, the ownerDetails field will be null
            }
        },
        {
            $sort: {
                score: { $meta: "textScore" }, // Primary sorting by relevance score
                views: -1 // Secondary sorting by views in descending order
            }
        },
        {
            $skip: (page-1) * limit
        },
        {
            $limit: parseInt(limit)
        }
    ]);
    
    console.log(videos);

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "Videos Fetched Successfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    const user = req.user;

    if(!title || !description){
        throw new ApiError(400, 'Title and Description are necessary')
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    if(!videoFileLocalPath){
        throw new ApiError(400, 'Video File not found')
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    if(!videoFile){
        throw new ApiError(500, 'Error while uploading video file')
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if(!thumbnailLocalPath){
        throw new ApiError(400, 'Thumbnail File not found')
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnail){
        throw new ApiError(500, 'Error while uploading thumbnail')
    }

    const video = await Video.create({
        videoFile: videoFile.url || "",
        thumbnail: thumbnail.url || "",
        owner: user._id,
        title,
        description,
        duration: videoFile.duration,
    })

    if(!video){
        throw new ApiError(500, 'Error while saving new video')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {video}, 'Video uploaded successfully')
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!videoId){
        throw new ApiError(400, 'Video id is required')
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, 'Video file not found')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, 'Video sent successfully')
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const {title, description} = req.body;
    if(!title || !description){
        throw new ApiError(400, 'did not get title and description')
    }

    const thumbnailLocalPath = req.file?.path;
    if(!thumbnailLocalPath){
        throw new ApiError(400, 'thumbnail not found')
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, 'No video found')
    }

    if (!((video?.owner).equals(req.user?._id))) {
        throw new ApiError(400,"You cannot Update the details")
    }

    const oldThumbnailUrl = video.thumbnail;
    const updatedThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!updatedThumbnail || !updatedThumbnail.url){
        throw new ApiError(500, 'Error occured while uploading the thumbnail')
    }

    try{
        await deleteFromCloudinary(oldThumbnailUrl);
    }
    catch{
        console.log('Error occured while deleting the old thumbnail')
    }

    video.title = title;
    video.description = description;
    video.thumbnail = updatedThumbnail.url;

    video.save({validateBeforeSave: false})

    res
    .status(200)
    .json(
        new ApiResponse(200, video, 'Video details updated successfully')
    );
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, 'Video not found')
    }

    if (!((video?.owner).equals(req.user?._id))) {
        throw new ApiError(400,"You cannot delete the video")
    }

    
    const deleteVideo = await deleteFromCloudinary(video.videoFile);
    if(deleteVideo.result !== 'ok'){
        throw new ApiError(500, 'Unable to Delete Video File')
    }

    const deleteThumb = await deleteFromCloudinary(video.thumbnail);
    if(deleteThumb.result !== 'ok'){
        throw new ApiError(500, 'Unable to Delete Thumbnail File')
    }

    const deletedVideoDocument = await Video.findByIdAndDelete(videoId);

    if(!deletedVideoDocument){
        throw new ApiError(500, 'Unable to delete video document from database')
    }

    return res
    .status(204)
    .json(
        new ApiResponse(204, {}, 'Video Deleted Successfully')
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId)
    if (!((video?.owner).equals(req.user?._id))) {
        throw new ApiError(400,"You cannot toggle the publish status")
    }
    const videoChanged = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished:!video.isPublished
            }
        },  
        {
            new:true
        }
    )
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        videoChanged,
        "Toggled Public Status Successfully"
    ))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}





// {
//     $lookup: {
//         from: "users",
//         localField: "owner",
//         foreignField: "_id",
//         as: "owner"
//     }
// },