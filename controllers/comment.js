const prisma = require("../config/connection");
const messages = require("../helper/messages");

/**
 * @openapi
 * /comment/{post_id}:
 *   post:
 *     summary: Create a new comment
 *     description: Creates a comment on a specific post for the currently authenticated user.
 *     tags:
 *       - Comments
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - in: path
 *         name: post_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Post ID that the comment belongs to.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - rating
 *             properties:
 *               content:
 *                 type: string
 *                 example: This post was really helpful.
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *     responses:
 *       201:
 *         description: Comment saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment Saved Successfully
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
 */
const create = async (req, res) => {
	try {
		const post_id = req.params.post_id;
		const user_id = req.session.user_id;
		const { content, rating } = req.body;

		await prisma.comment.create({
			data: {
				postId: post_id,
				userId: user_id,
				content,
				rating
			}
		});

		return messages.createdSuccessfully(res, "Comment Saved Successfully");
	} catch (error) {
		console.error("Saving comment error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /comment/{id}:
 *   get:
 *     summary: Get a single comment
 *     description: Returns one comment by its ID.
 *     tags:
 *       - Comments
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Comment ID.
 *     responses:
 *       200:
 *         description: Comment loaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 postId:
 *                   type: integer
 *                   example: 1
 *                 userId:
 *                   type: integer
 *                   example: 7
 *                 content:
 *                   type: string
 *                   example: This post was really helpful.
 *                 rating:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
const retrieve = async (req, res) => {
	try {
		const comment = req.data;

		res.json(comment);
	} catch (error) {
		console.error("Retrieving comment error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /comment/{id}:
 *   put:
 *     summary: Update a comment
 *     description: Updates an existing comment by its ID.
 *     tags:
 *       - Comments
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Comment ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: Updated comment content.
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment updated successfully
 *       400:
 *         description: Bad request / validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
const update = async (req, res) => {
	try {
		const id = req.params.id;

		const { content, rating } = req.body;

		await prisma.comment.update({
			where: { id },
			data: {
				content,
				rating
			}
		});

		return messages.success(res, "Comment updated successfully");
	} catch (error) {
		console.error("Updating comment error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /comment/{id}:
 *   delete:
 *     summary: Delete a comment
 *     description: Deletes an existing comment by its ID.
 *     tags:
 *       - Comments
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Comment ID.
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment deleted Successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
const remove = async (req, res) => {
	try {
		const id = req.params.id;

		await prisma.comment.delete({ where: { id } });

		return messages.deletedSuccessfully(res, "Comment deleted Successfully");
	} catch (error) {
		console.error("Deleting comment error: ", error);

		return messages.serverError(res);
	}
};

module.exports = {
	create,
	retrieve,
	update,
	remove
};

