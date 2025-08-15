import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { json } from "express";
import { uploadOnCloudinary } from "../services/cloudinary.service.js";
import { Video } from "../models/video.model.js";

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

const updateVideo = asyncHandler(async (req, res) => {});

const deleteVideo = asyncHandler(async (req, res) => {});

const togglepublishStatus = asyncHandler(async (req, res) => {});

const getAllVideos = asyncHandler(async (req, res) => {});

const getVideoById = asyncHandler(async (req, res) => {});

export {
  uploadVideo,
  updateVideo,
  deleteVideo,
  togglepublishStatus,
  getAllVideos,
  getVideoById,
};
