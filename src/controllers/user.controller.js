import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../services/cloudinary.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // no need to save in a variable

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "tokens could not be generated...");
  }
};

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
  const userExists = await User.findOne({
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
    avatar: avatar?.url,
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

const loginUser = asyncHandler(async (req, res) => {
  // TODOS:
  //req body => data
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required...");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  // check user exists or not -> username ya email m se koi ek

  if (!user) {
    throw new ApiError(404, "User not found...");
  }
  // password verification
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Credentials...");
  }
  // check access token and refresh token , generate them and send cookies along with them
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // find user -> userId -> to find currently logged in user is the challenge here
  // to take on this problem we need to implement our custom middleware to extract the data that is required to fetch the user details from database.

  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, // returns updated value
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id).select("-password");
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { newAccessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);
    return res
      .status(200)
      .cookie("accessToken", newAccessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
