const prisma = require("../config/connection");
const messages = require("../helper/messages");

/**
 * @openapi
 * /report/{post_id}:
 *   post:
 *     summary: Save a report
 *     description: Creates a new report for a post, or updates the current user's existing report on that post.
 *     tags:
 *       - Reports
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
 *         description: Post ID that the report belongs to.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: This post contains inappropriate content.
 *     responses:
 *       201:
 *         description: Report saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Report Saved Successfully
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
		const { reason } = req.body;

		await prisma.report.upsert({
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
				reason
			},
			update: {
				reason
			}
		});

		return messages.createdSuccessfully(res, "Report Saved Successfully");
	} catch (error) {
		console.error("Saving report error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /report/{id}:
 *   get:
 *     summary: Get a single report
 *     description: Returns one report by its ID.
 *     tags:
 *       - Reports
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Report ID.
 *     responses:
 *       200:
 *         description: Report loaded successfully
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
 *                 reason:
 *                   type: string
 *                   example: This post contains inappropriate content.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */
const retrieve = async (req, res) => {
	try {
		const report = req.data;

		res.json(report);
	} catch (error) {
		console.error("Retrieving report error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /report/{id}:
 *   put:
 *     summary: Update a report
 *     description: Updates an existing report by its ID.
 *     tags:
 *       - Reports
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
 *         description: Report ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Updated report reason.
 *     responses:
 *       200:
 *         description: Report updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Report updated successfully
 *       400:
 *         description: Bad request / validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */

const update = async (req, res) => {
	try {
		const id = req.params.id;

		const { reason } = req.body;

		await prisma.report.update({
			where: { id },
			data: {
				reason
			}
		});

		return messages.success(res, "Report updated successfully");
	} catch (error) {
		console.error("Updating report error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /report/{id}:
 *   delete:
 *     summary: Delete a report
 *     description: Deletes an existing report by its ID.
 *     tags:
 *       - Reports
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
 *         description: Report ID.
 *     responses:
 *       204:
 *         description: Report deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Report deleted Successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */

const remove = async (req, res) => {
	try {
		const id = req.params.id;

		await prisma.report.delete({ where: { id } });

		return messages.deletedSuccessfully(res, "Report deleted Successfully");
	} catch (error) {
		console.error("Deleting report error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /reports:
 *   get:
 *     summary: Get all reports
 *     description: Returns reports with optional pagination and reason search.
 *     tags:
 *       - Reports
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         description: Page number. Use together with limit.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           example: 10
 *         description: Number of reports per page. Use together with page.
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           example: inappropriate
 *         description: Searches report reasons.
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   reason:
 *                     type: string
 *                     example: This post contains inappropriate content.
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-06-24T10:00:00.000Z"
 *                   post:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: Post title
 *                       category:
 *                         type: string
 *                         example: Electronics
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 7
 *                       full_name:
 *                         type: string
 *                         example: Ahmad Ali
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
const get_all = async (req, res) => {
	try {
		let { page, limit, search } = req.query;

		const criteria = {};

		if (search) {
			criteria.OR = [
				{
					reason: {
						contains: search,
						mode: "insensitive"
					}
				}
			];
		}

		const queryOptions = {
			where: criteria,
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				reason: true,
				createdAt: true,
				post: {
					select: {
						id: true,
						title: true,
						category: {
							select: {
								name: true
							}
						}
					}
				},
				user: {
					select: {
						id: true,
						full_name: true
					}
				}
			}
		};

		if (page !== undefined && limit !== undefined) {
			queryOptions.skip = (page - 1) * limit;
			queryOptions.take = limit;
		}

		const reports = await prisma.report.findMany(queryOptions);

		const formattedReports = reports.map((report) => ({
			...report,
			post: {
				...report.post,
				category: report.post.category.name
			}
		}));

		return res.json(formattedReports);
	} catch (error) {
		console.error("Retreiving reports error: ", error);

		return messages.serverError(res);
	}
};

module.exports = {
	create,
	retrieve,
	update,
	remove,
	get_all
};

