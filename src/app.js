import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(express.static("public"));
app.use(cookieParser());

// routes imports
import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import videoRouter from "./routes/video.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import likeRouter from "./routes/like.routes.js";
import commentRouter from "./routes/comment.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

const ROUTE_PREFIX = "/api/v1";

// routes declaration
app.use(`${ROUTE_PREFIX}/user`, userRouter);
app.use(`${ROUTE_PREFIX}/video`, videoRouter);
app.use(`${ROUTE_PREFIX}/tweet`, tweetRouter);
app.use(`${ROUTE_PREFIX}/like`, likeRouter);
app.use(`${ROUTE_PREFIX}/playlist`, playlistRouter);
app.use(`${ROUTE_PREFIX}/subscription`, subscriptionRouter);
app.use(`${ROUTE_PREFIX}/healthcheck`, healthcheckRouter);
app.use(`${ROUTE_PREFIX}/comment`, commentRouter);
app.use(`${ROUTE_PREFIX}/dashboard`, dashboardRouter);

export { app };
