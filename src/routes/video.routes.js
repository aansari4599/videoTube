import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { updateVideo, uploadVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

// getAllVideos, uploadvideo,update video, publish video, togglepublishStatus, delete video, getVideoById --> all paths secured

router.route("/publish-video").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  uploadVideo
);

router
  .route("/update-video/v/:videoId")
  .patch(upload.single("thumbnail"), updateVideo);

export default router;
