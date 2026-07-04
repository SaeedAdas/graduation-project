const prisma = require("../config/connection");
const messages = require("../helper/messages");

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
 *         csrfToken: []
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
 *                 type: string
 *                 example: News
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
 *         description: Bad request / validation error
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

		const post = await prisma.post.create({
			data: {
				category,
				title,
				userId: user_id,
				description: description ?? null
			}
		});

		return messages.createdSuccessfully(res, "Post Created Successfully");

	} catch (error) {
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
  *         description: Post ID
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
  *                   example: This is the post description
  *       401:
  *         description: Unauthorized
  *       403:
  *         description: Forbidden
  *       404:
  *         description: Post not found
  */
const retrieve = async (req, res) => {
	const post = req.data;

	res.json(post);
};

const get_posts = async (req, res) => {
	try {


		let { page, limit, search, searchIn, category } = req.query;
		
		// where clause should be retrieved from an authorization query scope engine
		const authorizationWhere = {};

		const criteria = {

		};

		// Non-existing categories would return [] regardless of page, limit, search
		if (category !== undefined) {
			criteria.category_id = category	
		}

		if (search) {
			if (searchIn != undefined) {
				criteria[searchIn] = {
					contains: search,
					mode: "insensitive"
				}
			} else {
				criteria.OR = [
					{
						title: {
							contains: search,
							mode: "insensitive"
						}
					},
					{
						description: {
							contains: search,
							mode: "insensitive"
						}
					}
				]
			}
		}

		const queryOptions = {
			where: {
				AND: [
					authorizationWhere,
					criteria
				]
			},
			orderBy: {"createdAt": "desc"},
			select: {
				title: true,
				category: {
					select: {
						name: true
					}
				},
				description: true,
				createdAt: true,
				_count: {
					select: {
						comments: true,
						reactions: true
					}
				}
			}
		}

		if (page !== undefined && limit !== undefined) {
			queryOptions.skip = (page - 1) * limit;
			queryOptions.take = limit;
		}

	
		const posts = await prisma.post.findMany(queryOptions);

		const formattedPosts = posts.map((post) => ({
			...post,
			category: post.category.name
		}))

		return res.json(formattedPosts);

	} catch (error) {
		console.error("Retreiving posts error: ", error);

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
 *         csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 example: News
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
 *         description: Bad request / validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 *
 */

const update = async (req, res) => {
	try {
		const id = req.params.id;

		const { category, title, description } = req.body;

		await prisma.post.update({
			where: {id},
			data: {
				category,
				title,
				description
			}
		});

		return messages.success(res, "Post updated successfully");
		
	} catch (error) {
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
 *         csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
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

		await prisma.post.delete({where: {id}});

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
	get_posts
};
