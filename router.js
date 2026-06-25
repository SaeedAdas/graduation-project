const express = require("express");
const router = express.Router();
const swaggerUi = require("swagger-ui-express");
const { swaggerOptions, swaggerSpec } = require("./config/swagger");


// middlewares
const userValidation = require("./validations/user");
const postValidation = require("./validations/post");
const commentValidation = require("./validations/comment");
const reportValidation = require("./validations/report");
const reactionValidation = require("./validations/reaction");
const { authenticate } = require("./middlewares/authenticate");
const { authorize } = require("./middlewares/authorize");
const { validate } = require("./middlewares/validate");
const { 
	loadPost,
	loadComment,
	loadReport,
	loadReaction
} = require("./middlewares/loadResources");


// Controllers
const userController = require("./controllers/user")
const postController = require("./controllers/post")
const commentController = require("./controllers/comment")
const reportController = require("./controllers/report")
const reactionController = require("./controllers/reaction")


// Swagger documentation
// We need use instead of get to serve swagger subfolders and files
router.use("/api-docs", authenticate, authorize("api", "view"), swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// Routes

router.post("/auth/login", validate(userValidation.login), userController.login);
router.post("/user/register", validate(userValidation.register), userController.register);
router.post("/auth/logout", authenticate, userController.logout);
router.get("/user/profile", authenticate, userController.profile);
router.get("/my-posts", authenticate, userController.posts);
router.put("/user/profile", authenticate, validate(userValidation.update), userController.update_profile);

router.post("/post", authenticate, validate(postValidation.create), authorize("posts", "create"), postController.create);
router.get("/post/:id", authenticate, validate(), loadPost, authorize("posts", "view"), postController.retrieve);
router.put("/post/:id", authenticate, validate(postValidation.update), loadPost, authorize("posts", "update"), postController.update);
router.delete("/post/:id", authenticate, validate(), loadPost, authorize("posts", "remove"), postController.remove);

router.post("/comment/:post_id", authenticate, validate(commentValidation.create), loadPost, authorize("comments", "create"), commentController.create);
router.get("/comment/:id", authenticate, validate(), loadComment, authorize("comments", "view"), commentController.retrieve);
router.put("/comment/:id", authenticate, validate(commentValidation.update), loadComment, authorize("comments", "update"), commentController.update);
router.delete("/comment/:id", authenticate, validate(), loadComment, authorize("comments", "remove"), commentController.remove);

router.post("/report/:post_id", authenticate, validate(reportValidation.create), loadPost, authorize("reports", "create"), reportController.create);
router.get("/report/:id", authenticate, validate(), loadReport, authorize("reports", "view"), reportController.retrieve);
router.put("/report/:id", authenticate, validate(reportValidation.update), loadReport, authorize("reports", "update"), reportController.update);
router.delete("/report/:id", authenticate, validate(), loadReport, authorize("reports", "remove"), reportController.remove);

router.post("/reaction/:post_id", authenticate, validate(reactionValidation.create), loadPost, authorize("reactions", "create"), reactionController.create);
router.get("/reaction/:id", authenticate, validate(), loadReaction, authorize("reactions", "view"), reactionController.retrieve);
router.put("/reaction/:id", authenticate, validate(reactionValidation.update), loadReaction, authorize("reactions", "update"), reactionController.update);
router.delete("/reaction/:id", authenticate, validate(), loadReaction, authorize("reactions", "remove"), reactionController.remove);



module.exports = router;
