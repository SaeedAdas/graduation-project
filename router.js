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
const categoryValidation = require("./validations/category");
const parameterValidation = require("./validations/parameter");
const queryValidation = require("./validations/query");
const { authenticate } = require("./middlewares/authenticate");
const { authorize } = require("./middlewares/authorize");
const { validate } = require("./middlewares/validate");
const { 
	loadPost,
	loadComment,
	loadReport,
	loadReaction,
	loadCategory
} = require("./middlewares/loadResources");


// Controllers
const userController = require("./controllers/user")
const postController = require("./controllers/post")
const commentController = require("./controllers/comment")
const reportController = require("./controllers/report")
const reactionController = require("./controllers/reaction")
const categoryController = require("./controllers/category")


// Swagger documentation
// We need use instead of get to serve swagger subfolders and files
router.use("/api-docs", authenticate, authorize("api", "view"), swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// Routes

router.post(
	"/auth/login", 
	validate({ body: userValidation.login }), 
	userController.login
);

router.post(
	"/user/register", 
	validate({ body: userValidation.register }), 
	userController.register
);

router.post(
	"/auth/logout", 
	authenticate, 
	userController.logout
);

router.get(
	"/user/profile", 
	authenticate, 
	userController.profile
);

router.get(	
	"/my-posts", 
	authenticate, 
	validate({ query: queryValidation.post }),
	userController.posts
);

router.put(
	"/user/profile", 
	authenticate, 
	validate({ body: userValidation.update }), 
	userController.update_profile
);

router.post(
	"/post", 
	authenticate, 
	validate({ body: postValidation.create }), 
	authorize("posts", "create"), 
	postController.create
);

// Current authorization model checks for a single resource. For multiple resources, authorization should be done at database-level by querying efficiently
router.get(
	"/posts", 
	authenticate, 
	validate({ query: queryValidation.post }), 
	postController.get_posts
);

router.get(
	"/post/:id", 
	authenticate, 
	validate({ params: parameterValidation.id }), 
	loadPost, 
	authorize("posts", "view"), 
	postController.retrieve
);

router.put(
	"/post/:id", 
	authenticate, 
	validate({ body: postValidation.update, params: parameterValidation.id }), 
	loadPost, 
	authorize("posts", "update"), 
	postController.update
);

router.delete(
	"/post/:id", 
	authenticate, 
	validate({ params: parameterValidation.id }), 
	loadPost, 
	authorize("posts", "remove"), 
	postController.remove
);

router.post(
	"/comment/:post_id", 
	authenticate, 
	validate({ body: commentValidation.create, params: parameterValidation.post_id }), 
	loadPost, 
	authorize("comments", "create"), 
	commentController.create
);

router.get(
	"/comment/:id", 
	authenticate, 
	validate({ params: parameterValidation.id }), 
	loadComment, 
	authorize("comments", "view"), 
	commentController.retrieve
);
router.put(
	"/comment/:id", 
	authenticate, 
	validate({ body: commentValidation.update, params: parameterValidation.post_id }), 
	loadComment, 
	authorize("comments", "update"), 
	commentController.update
);
router.delete(
	"/comment/:id", 
	authenticate, 
	validate({ params: parameterValidation.id }), 
	loadComment, 
	authorize("comments", "remove"), 
	commentController.remove
);

router.post(
	"/report/:post_id", 
	authenticate, 
	validate({ body: reportValidation.create, params: parameterValidation.post_id }), 
	loadPost, 
	authorize("reports", "create"), 
	reportController.create
);

router.get(
	"/report/:id", 
	authenticate, 
	validate({ params: parameterValidation.id }),
	loadReport, 
	authorize("reports", "view"), 
	reportController.retrieve
);

router.put(
	"/report/:id", 
	authenticate, 
	validate({ body: reportValidation.update, params: parameterValidation.id }), 
	loadReport, 
	authorize("reports", "update"), 
	reportController.update
);

router.delete(
	"/report/:id", 
	authenticate, 
	validate({ params: parameterValidation.id }), 
	loadReport, 
	authorize("reports", "remove"), 
	reportController.remove
);

router.post(
	"/reaction/:post_id", 
	authenticate, 
	validate({ body: reactionValidation.create, params: parameterValidation.post_id }), 
	loadPost, 
	authorize("reactions", "create"), 
	reactionController.create
);

router.get(
	"/reaction/:id", 
	authenticate, 
	validate({ params: parameterValidation.id }), 
	loadReaction, 
	authorize("reactions", "view"), 
	reactionController.retrieve
);

router.put(
	"/reaction/:id", 
	authenticate, 
	validate({ body: reactionValidation.update, params: parameterValidation.id }), 
	loadReaction, 
	authorize("reactions", "update"), 
	reactionController.update
);

router.delete(
	"/reaction/:id", 
	authenticate, 
	validate({ params: parameterValidation.id }), 
	loadReaction, 
	authorize("reactions", "remove"), 
	reactionController.remove
);

router.post(
	"/category", 
	authenticate, 
	validate({ body: categoryValidation.create }), 
	authorize("categories", "create"), 
	categoryController.create
);

/*
router.get(
	"/category/:id", 
	authenticate, 
	validate({ params: parameterValidation.id }), 
	loadCategory,
	authorize("categories", "view"), 
	categoryController.retrieve
);
*/

router.get(
	"/categories", 
	authenticate, 
	validate({ query: queryValidation.category }), 
	categoryController.get_all
);


router.put(
	"/category/:id", 
	authenticate, 
	validate({ body: categoryValidation.update, params: parameterValidation.id }), 
	loadCategory,
	authorize("categories", "update"), 
	categoryController.update
);

router.delete(
	"/category/:id", 
	authenticate, 
	validate({ params: parameterValidation.id }), 
	loadCategory,
	authorize("categories", "remove"), 
	categoryController.remove
);


module.exports = router;
