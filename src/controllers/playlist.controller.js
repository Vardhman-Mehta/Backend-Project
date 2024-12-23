import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    // playlist : name, description, videos, owner, createdAt, updatedAt

    if(!name || !description){
        throw new ApiError(400, 'Name and Description is required')
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
    })

    if(!playlist){
        throw new ApiError(500, 'Error occured while creating playlist')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, 'Playlist Created Successfully')
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const playlists = await Playlist.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            }
        ]
    )

    if(!playlists){
        throw new ApiError(500, 'Error occured while fetching playlists')
    }

    if(!playlists.length){
        throw new ApiError(404, 'No Playlists found for this user')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlists, 'Playlists Fetched Successfully')
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(500, 'Error while fetching playlist')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, 'Playlist Fetched Successfully')
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "you do not have permission to perform this action");
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already in playlist");
    }

    const addToPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        { new: true }
    )

    if (!addToPlaylist) {
        throw new ApiError(500, "Error occured while adding video to playlist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, addToPlaylist, "Video added to playlist successfully")
    );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "you do not have permission to perform this action");
    }

    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video not in the playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId }, // Removes videoId from the videos array
        },
        { new: true } // `new: true` returns the updated document
    );

    if(!updatedPlaylist){
        throw new ApiError(500, 'Error occured while removing the video from playlist')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, 'Video removed from playlist successfully')
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            401,
            "you do not have permission to perform this action"
        );
    }

    const result = await Playlist.findByIdAndDelete(playlistId);

    if(!result){
        throw new ApiError(500, 'Error Occured While Deleting the Playlist')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, result, 'Playlist Deleted Successfully')
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400, "Playlist not found");
    }

    if (!name || !description) {
        throw new ApiError(400, "Name and Description are Required");
    }

    if (playlist?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            401,
            "you do not have permission to perform this action"
        );
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name || playlist?.name,
                description: description || playlist?.description,
            },
        },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(500, "Error while updating playlist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}