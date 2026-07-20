const { Prisma } = require("@prisma/client");
const prisma = require("../config/connection");
const messages = require("../helper/messages");
const { handlePrismaError } = require("../helper/prismaErrors");
const postRepository = require("../repositories/postRepository");

/**
 * @openapi
 * /post:
 *   post:
 *     summary: Create a new post
 *     description: Creates a new post for the currently authenticated user.
 *     tags:
 *       - Posts
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - title
 *             properties:
 *               category:
 *                 type: integer
 *                 example: 1
 *                 description: Category ID.
 *               title:
 *                 type: string
 *                 example: My first post
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: This is the post description
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post Created Successfully
 *       400:
 *         description: Bad request / validation error / invalid category
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       500:
 *         description: Internal server error
 */

const create = async (req, res) => {
	try {
		const { category, title, description } = req.body;

		const user_id = req.session.user_id;

		await prisma.post.create({
			data: {
				categoryId: category,
				title,
				userId: user_id,
				description: description ?? null
			}
		});

		return messages.createdSuccessfully(res, "Post Created Successfully");

	} catch (error) {
		const handled = handlePrismaError(res, error, {
			foreignKeyMessage: "Category id not found"
		});

		if (handled) return handled;

		console.error("Creating post error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /post/{id}:
 *   get:
 *     summary: Get a single post
 *     description: Returns one post by its ID.
 *     tags:
 *       - Posts
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Post ID.
 *     responses:
 *       200:
 *         description: Post loaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 category:
 *                   type: string
 *                   example: News
 *                 title:
 *                   type: string
 *                   example: My first post
 *                 description:
 *                   type: string
 *                   nullable: true
 *                   example: This is the post description
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
const retrieve = async (req, res) => {
	const post = req.data;

	res.json(post);
};

/**
 * @openapi
 * /post/{id}:
 *   get:
 *     summary: Get a single post
 *     description: Returns one post by its ID.
 *     tags:
 *       - Posts
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Post ID.
 *     responses:
 *       200:
 *         description: Post loaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 category:
 *                   type: string
 *                   example: News
 *                 title:
 *                   type: string
 *                   example: My first post
 *                 description:
 *                   type: string
 *                   nullable: true
 *                   example: This is the post description
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */

const postDetails = async (req, res) => {
	try {
		const post_id = req.params.id;
		const user_id = req.user.id;

		const { page, limit } = req.query;
		
		const posts = await postRepository.listPostWithDetails(post_id, page, limit, user_id)

		return res.json(posts);

	} catch (error) {
		console.error("Retreiving post details error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /posts:
 *   get:
 *     summary: Get multiple posts
 *     description: Returns posts with optional pagination, search, and category filtering.
 *     tags:
 *       - Posts
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         description: Page number. Use together with limit.
 *       - in: query
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *         description: Number of posts per page. Use together with page.
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           example: laptop
 *         description: Search term.
 *       - in: query
 *         name: searchIn
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - title
 *             - description
 *           example: title
 *         description: Field to search in. If omitted, both title and description are searched.
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: String
 *           example: Electronics
 *         description: Category name.
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: Post title
 *                   category:
 *                     type: string
 *                     example: Electronics
 *                   description:
 *                     type: string
 *                     nullable: true
 *                     example: Post description
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-06-24T10:00:00.000Z"
 *                   commentsCount:
 *                     type: number
 *                     example: 3
 *                   averageRating:
 *                     type: float
 *                     example: 4.2
 *                   reactionsCount:
 *                     type: number
 *                     example: 3
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

const listPosts = async (req, res) => {
	try {
		const user_id = req.user.id;
		const posts = await postRepository.listPostsWithStats({...req.query, currentUserId: user_id});

		return res.json(posts);

	} catch (error) {
		console.error("Retreiving posts error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /posts/user/{id}:
 *   get:
 *     summary: Get multiple posts for specific user
 *     description: Returns posts by user id with optional pagination, search, and category filtering.
 *     tags:
 *       - Posts
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: User ID.
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         description: Page number. Use together with limit.
 *       - in: query
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *         description: Number of posts per page. Use together with page.
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           example: laptop
 *         description: Search term.
 *       - in: query
 *         name: searchIn
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - title
 *             - description
 *           example: title
 *         description: Field to search in. If omitted, both title and description are searched.
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: String
 *           example: Electronics
 *         description: Category name.
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: Post title
 *                   category:
 *                     type: string
 *                     example: Electronics
 *                   description:
 *                     type: string
 *                     nullable: true
 *                     example: Post description
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-06-24T10:00:00.000Z"
 *                   commentsCount:
 *                     type: number
 *                     example: 3
 *                   averageRating:
 *                     type: float
 *                     example: 4.2
 *                   reactionsCount:
 *                     type: number
 *                     example: 3
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

const userPosts = async (req, res) => {
	try {
		const targetUserId = req.params.id;
		const currentUserId = req.user.id;
		
		const condition = { userId: targetUserId };

		const posts = await postRepository.listPostsWithStats({...req.query, currentUserId, condition});

		return res.json(posts);

	} catch (error) {
		console.error("Retreiving targeted user posts error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /post/{id}:
 *   put:
 *     summary: Update a post
 *     description: Updates an existing post by its ID.
 *     tags:
 *       - Posts
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Post ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: integer
 *                 example: 1
 *                 description: Category ID.
 *               title:
 *                 type: string
 *                 example: Updated post title
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Updated post description
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post updated successfully
 *       400:
 *         description: Bad request / validation error / invalid category
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */

const update = async (req, res) => {
	try {
		const id = req.params.id;

		const { category, title, description } = req.body;

		await prisma.post.update({
			where: { id },
			data: {
				categoryId: category,
				title,
				description
			}
		});

		return messages.success(res, "Post updated successfully");
	} catch (error) {
		const handled = handlePrismaError(res, error, {
			foreignKeyMessage: "Category id not found"
		});

		if (handled) return handled;

		console.error("updating post error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /post/{id}:
 *   delete:
 *     summary: Delete a post
 *     description: Deletes an existing post by its ID.
 *     tags:
 *       - Posts
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Post ID.
 *     responses:
 *       204:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post deleted Successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */

const remove = async (req, res) => {
	try {
		const id = req.params.id;

		await prisma.post.delete({ where: { id } });

		return messages.deletedSuccessfully(res, "Post deleted Successfully");
	} catch (error) {
		console.error("Deleting post error: ", error);

		return messages.serverError(res);
	}
};

module.exports = {
	create,
	retrieve,
	update,
	remove,
	listPosts,
	userPosts,
	postDetails
};

