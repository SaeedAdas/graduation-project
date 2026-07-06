const prisma = require("../config/connection");
const messages = require("../helper/messages");

/**
 * @openapi
 * /reaction/{post_id}:
 *   post:
 *     summary: Save a reaction
 *     description: Creates a new reaction for a post, or updates the current user's existing reaction on that post.
 *     tags:
 *       - Reactions
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
 *         description: Post ID that the reaction belongs to.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reaction
 *             properties:
 *               reaction:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Reaction saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reaction Saved Successfully
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
		const { reaction } = req.body;

		// upsert: create new or update existing record
		await prisma.reaction.upsert({
			where: {
				userId_postId: {
					// compound key
					postId: post_id,
					userId: user_id
				}
			},
			create: {
				postId: post_id,
				userId: user_id,
				reaction
			},
			update: {
				reaction
			}
		});

		return messages.createdSuccessfully(res, "Reaction Saved Successfully");
	} catch (error) {
		console.error("Saving reaction error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /reaction/{id}:
 *   get:
 *     summary: Get a single reaction
 *     description: Returns one reaction by its ID.
 *     tags:
 *       - Reactions
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Reaction ID.
 *     responses:
 *       200:
 *         description: Reaction loaded successfully
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
 *                 reaction:
 *                   type: integer
 *                   example: 1
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Reaction not found
 *       500:
 *         description: Internal server error
 */
const retrieve = async (req, res) => {
	try {
		const reaction = req.data;

		res.json(reaction);
	} catch (error) {
		console.error("Retrieving reaction error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /reaction/{id}:
 *   put:
 *     summary: Update a reaction
 *     description: Updates an existing reaction by its ID.
 *     tags:
 *       - Reactions
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
 *         description: Reaction ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reaction
 *             properties:
 *               reaction:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Reaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reaction updated successfully
 *       400:
 *         description: Bad request / validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       404:
 *         description: Reaction not found
 *       500:
 *         description: Internal server error
 */
const update = async (req, res) => {
	try {
		const id = req.params.id;
		const { reaction } = req.body;

		await prisma.reaction.update({
			where: { id },
			data: {
				reaction
			}
		});

		return messages.success(res, "Reaction updated successfully");
	} catch (error) {
		console.error("Updating reaction error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /reaction/{id}:
 *   delete:
 *     summary: Delete a reaction
 *     description: Deletes an existing reaction by its ID.
 *     tags:
 *       - Reactions
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
 *         description: Reaction ID.
 *     responses:
 *       200:
 *         description: Reaction deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reaction deleted Successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       404:
 *         description: Reaction not found
 *       500:
 *         description: Internal server error
 */
const remove = async (req, res) => {
	try {
		const id = req.params.id;

		await prisma.reaction.delete({ where: { id } });

		return messages.deletedSuccessfully(res, "Reaction deleted Successfully");
	} catch (error) {
		console.error("Deleting reaction error: ", error);

		return messages.serverError(res);
	}
};

module.exports = {
	create,
	retrieve,
	update,
	remove
};

