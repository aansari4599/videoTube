import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { json } from "express";
import { uploadOnCloudinary } from "../services/cloudinary.service.js";
import { Video } from "../models/video.model.js";
import { isValidObjectId } from "mongoose";

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!(title && description)) {
    throw new ApiError(400, "title or description could not be found");
  }

  const videoPath = req.files?.videoFile[0].path;
  const thumbnailPath = req.files?.thumbnail[0].path;

  if (!videoPath) throw new ApiError(400, "video not found");
  if (!thumbnailPath) throw new ApiError(400, "thumbnail not found");

  const videoFile = await uploadOnCloudinary(videoPath);
  const thumbnail = await uploadOnCloudinary(thumbnailPath);

  if (!(thumbnail || videoFile))
    throw new ApiError(400, "file could not get uploaded");
  // after uploading clear the files from local server
  const video = await Video.create({
    videoFile: videoFile?.url,
    thumbnail: thumbnail?.url,
    title,
    description,
    duration: videoFile?.duration,
    owner: req.user,
  });

  // take duration from cloudinary response
  if (!video) throw new ApiError(500, "something went wrong while publishing");
  return res
    .status(201)
    .json(new ApiResponse(200, video, "video published successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(400, "Video id not found");
  const { title, description } = req.body;

  // not required for update as user may or may not want to update them
  //   if (!(title || description)) {
  //     throw new ApiError(400, "title or description could not be found");
  //   }

  const updatedData = {};
  if (title) updatedData = { ...updatedData, title };
  if (description) updatedData = { ...updatedData, description };
  if (req.file) {
    const thumbnailPath = req.file?.path;
    if (!thumbnailPath) throw new ApiError(400, "thumbnail not found");
    const updatedThumbnail = await uploadOnCloudinary(thumbnailPath);
    if (!updatedThumbnail)
      throw new ApiError(500, "thumbnail could not get uploaded");
    updatedData = { ...updatedData, thumbnail: updatedThumbnail?.url };
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: updatedData,
    },
    { new: true, runValidators: true }
  );

  if (!updateVideo)
    throw new ApiError(
      500,
      "something went wrong while updating video metadata"
    );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  const toggleVideo = await Video.findById(videoId);
  if (!toggleVideo)
    throw new ApiError(500, "something went wrong while fetching video status");
  toggleVideo.isPublished = !toggleVideo.isPublished;

  toggleVideo.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        toggleVideo,
        "Video publish status changed successfully"
      )
    );
});
// need to use Pagination later using aggregate pipeline

const getAllVideos = asyncHandler(async (req, res) => {});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");
  /*
 Video Retrieval Notes:

 What does `.populate("owner", "name email")` do?
   - By default, the `owner` field in the video document only contains the owner's `_id`.
   - `populate()` replaces this ID with an actual object containing the owner's `name` and `email`.
   - This reduces extra API calls from the frontend to fetch user details separately.
*/
  const video = await Video.findById(videoId).populate(
    "owner",
    "fullname email username"
  );
  if (!video) throw new ApiError(500, "video could not be fetched");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

export {
  uploadVideo,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getAllVideos,
  getVideoById,
};
