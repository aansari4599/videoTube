import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../services/cloudinary.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // Algorithm to register a user
  // get user details from frontend-> postman
  const { username, email, fullname, password } = req.body;
  console.log(username, email);

  // validations => not empty , more can be used later
  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  )
    throw new ApiError(400, "all fields are required");

  // check if the user already exists -> either username or email or both
  const userExists = User.findOne({
    $or: [{ username }, { email }],
  });
  if (userExists)
    throw new ApiError(409, "User with email or username already exists");

  // check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required");

  // upload images, check avatar on multer and cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) throw new ApiError(400, "Avatar file is required");

  // create user object and create entry in db and login
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check for user creation -> response should not be null from db
  if (!createdUser) throw new ApiError(500, "user could not be registered...");

  // if yes login and return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully..."));
});
export { registerUser };
