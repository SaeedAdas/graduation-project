const express = require("express");
const router = express.Router();
const swaggerUi = require("swagger-ui-express");
const { swaggerOptions, swaggerSpec } = require("./config/swagger");


// middlewares
const userValidator = require("./validations/user");
const postValidator = require("./validations/post");
const commentValidator = require("./validations/comment");
const reportValidator = require("./validations/report");
const reactionValidator = require("./validations/reaction");
const categoryValidator = require("./validations/category");
const parameterValidator = require("./validations/parameter");
const queryValidator = require("./validations/query");
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
	validate({ body: userValidator.login }), 
	userController.login
);

router.post(
	"/user/register", 
	validate({ body: userValidator.register }), 
	userController.register
);

router.get(
	"/users", 
	authenticate, 
	authorize("users", "view_all"),
	userController.get_all
);

router.post(
	"/user", 
	authenticate, 
	validate({ body: userValidator.addOrUpdate }), 
	authorize("users", "create"), 
	userController.add
);

router.put(
	"/user/:id", 
	authenticate, 
	validate({ body: userValidator.addOrUpdate, params: parameterValidator.id }), 
	authorize("users", "update"), 
	userController.update
);

router.delete(
	"/user/:id", 
	authenticate, 
	validate({ params: parameterValidator.id }), 
	authorize("users", "remove"), 
	userController.remove
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
	"/user/posts", 
	authenticate, 
	validate({ query: queryValidator.post }),
	userController.posts
);

router.put(
	"/user/profile", 
	authenticate, 
	validate({ body: userValidator.update_profile }), 
	userController.update_profile
);

router.post(
	"/post", 
	authenticate, 
	validate({ body: postValidator.create }), 
	authorize("posts", "create"), 
	postController.create
);

// Current authorization model checks for a single resource. For multiple resources, authorization should be done at database-level by querying efficiently
router.get(
	"/posts", 
	authenticate, 
	validate({ query: queryValidator.post }), 
	postController.listPosts
);

router.get(
	"/post/:id", 
	authenticate, 
	validate({ params: parameterValidator.id }), 
	loadPost, 
	authorize("posts", "view"), 
	postController.retrieve
);

router.put(
	"/post/:id", 
	authenticate, 
	validate({ body: postValidator.update, params: parameterValidator.id }), 
	loadPost, 
	authorize("posts", "update"), 
	postController.update
);

router.delete(
	"/post/:id", 
	authenticate, 
	validate({ params: parameterValidator.id }), 
	loadPost, 
	authorize("posts", "remove"), 
	postController.remove
);

router.post(
	"/comment/:post_id", 
	authenticate, 
	validate({ body: commentValidator.create, params: parameterValidator.post_id }), 
	loadPost, 
	authorize("comments", "create"), 
	commentController.create
);

router.get(
	"/comment/:id", 
	authenticate, 
	validate({ params: parameterValidator.id }), 
	loadComment, 
	authorize("comments", "view"), 
	commentController.retrieve
);
router.put(
	"/comment/:id", 
	authenticate, 
	validate({ body: commentValidator.update, params: parameterValidator.id }), 
	loadComment, 
	authorize("comments", "update"), 
	commentController.update
);
router.delete(
	"/comment/:id", 
	authenticate, 
	validate({ params: parameterValidator.id }), 
	loadComment, 
	authorize("comments", "remove"), 
	commentController.remove
);

router.post(
	"/report/:post_id", 
	authenticate, 
	validate({ body: reportValidator.create, params: parameterValidator.post_id }), 
	loadPost, 
	authorize("reports", "create"), 
	reportController.create
);

router.get(
	"/report/:id", 
	authenticate, 
	validate({ params: parameterValidator.id }),
	loadReport, 
	authorize("reports", "view"), 
	reportController.retrieve
);

router.get(
	"/reports", 
	authenticate, 
	validate({ query: queryValidator.report }), 
	authorize("reports", "view_all"), 
	reportController.get_all
);

router.put(
	"/report/:id", 
	authenticate, 
	validate({ body: reportValidator.update, params: parameterValidator.id }), 
	loadReport, 
	authorize("reports", "update"), 
	reportController.update
);

router.delete(
	"/report/:id", 
	authenticate, 
	validate({ params: parameterValidator.id }), 
	loadReport, 
	authorize("reports", "remove"), 
	reportController.remove
);

router.post(
	"/reaction/:post_id", 
	authenticate, 
	validate({ body: reactionValidator.create, params: parameterValidator.post_id }), 
	loadPost, 
	authorize("reactions", "create"), 
	reactionController.create
);

router.get(
	"/reaction/:id", 
	authenticate, 
	validate({ params: parameterValidator.id }), 
	loadReaction, 
	authorize("reactions", "view"), 
	reactionController.retrieve
);

router.put(
	"/reaction/:id", 
	authenticate, 
	validate({ body: reactionValidator.update, params: parameterValidator.id }), 
	loadReaction, 
	authorize("reactions", "update"), 
	reactionController.update
);

router.delete(
	"/reaction/:id", 
	authenticate, 
	validate({ params: parameterValidator.id }), 
	loadReaction, 
	authorize("reactions", "remove"), 
	reactionController.remove
);

router.post(
	"/category", 
	authenticate, 
	validate({ body: categoryValidator.create }), 
	authorize("categories", "create"), 
	categoryController.create
);

/*
router.get(
	"/category/:id", 
	authenticate, 
	validate({ params: parameterValidator.id }), 
	loadCategory,
	authorize("categories", "view"), 
	categoryController.retrieve
);
*/

router.get(
	"/categories", 
	authenticate, 
	validate({ query: queryValidator.category }), 
	authorize("categories", "view_all"),
	categoryController.get_all
);


router.put(
	"/category/:id", 
	authenticate, 
	validate({ body: categoryValidator.update, params: parameterValidator.id }), 
	loadCategory,
	authorize("categories", "update"), 
	categoryController.update
);

router.delete(
	"/category/:id", 
	authenticate, 
	validate({ params: parameterValidator.id }), 
	loadCategory,
	authorize("categories", "remove"), 
	categoryController.remove
);


module.exports = router;
