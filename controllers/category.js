const { Prisma } = require("@prisma/client");
const prisma = require("../config/connection");
const messages = require("../helper/messages");
const { handlePrismaError } = require("../helper/prismaErrors");

/**
 * @openapi
 * /category:
 *   post:
 *     summary: Create a category
 *     description: Creates a new category. Category names must be unique.
 *     tags:
 *       - Categories
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Electronics
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Posts related to electronics.
 *     responses:
 *       201:
 *         description: Category saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Category Saved Successfully
 *       400:
 *         description: Bad request / validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       409:
 *         description: Category name already exists
 *       500:
 *         description: Internal server error
 */

const create = async (req, res) => {
	try {
		const { name, description } = req.body;

		await prisma.category.create({
			data: {
				name,
				description
			}
		});

		return messages.createdSuccessfully(res, "Category Saved Successfully");
	} catch (error) {
		const handled = handlePrismaError(res, error, {
			uniqueMessage: "Category name already Exists"
		});

		if (handled) return handled;

		console.error("Saving category error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: Get categories
 *     description: Returns categories with optional pagination and search.
 *     tags:
 *       - Categories
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
 *         description: Number of categories per page. Use together with page.
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           example: electronics
 *         description: Searches category name and description.
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                   name:
 *                     type: string
 *                     example: Electronics
 *                   description:
 *                     type: string
 *                     nullable: true
 *                     example: Posts related to electronics.
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-06-24T10:00:00.000Z"
 *                   _count:
 *                     type: object
 *                     properties:
 *                       posts:
 *                         type: integer
 *                         example: 5
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

		// where clause should be retrieved from an authorization query scope engine
		const authorizationWhere = {};

		const criteria = {};

		if (search) {
			criteria.OR = [
				{
					name: {
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
			];
		}

		const queryOptions = {
			where: {
				AND: [authorizationWhere, criteria]
			},
			select: {
				id: true,
				name: true,
				description: true,
				createdAt: true,
				_count: {
					select: {
						posts: true
					}
				}
			}
		};

		if (page !== undefined && limit !== undefined) {
			queryOptions.skip = (page - 1) * limit;
			queryOptions.take = limit;
		}

		const categories = await prisma.category.findMany(queryOptions);

		return res.json(categories);
	} catch (error) {
		console.error("Retreiving categories error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /category/{id}:
 *   put:
 *     summary: Update a category
 *     description: Updates an existing category by ID.
 *     tags:
 *       - Categories
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
 *         description: Category ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Electronics
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Updated category description.
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Category updated successfully
 *       400:
 *         description: Bad request / validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category name already exists
 *       500:
 *         description: Internal server error
 */

const update = async (req, res) => {
	try {
		const id = req.params.id;

		const { name, description } = req.body;

		await prisma.category.update({
			where: { id },
			data: {
				name,
				description
			}
		});

		return messages.success(res, "Category updated successfully");
	} catch (error) {
		const handled = handlePrismaError(res, error, {
			uniqueMessage: "Category name already Exists"
		});

		if (handled) return handled;

		console.error("Updating category error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /category/{id}:
 *   delete:
 *     summary: Delete a category
 *     description: Deletes an existing category by ID.
 *     tags:
 *       - Categories
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
 *         description: Category ID.
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Category deleted Successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */

const remove = async (req, res) => {
	try {
		const id = req.params.id;

		await prisma.category.delete({ where: { id } });

		return messages.deletedSuccessfully(res, "Category deleted Successfully");
	} catch (error) {
		console.error("Deleting category error: ", error);

		return messages.serverError(res);
	}
};

module.exports = {
	create,
	update,
	remove,
	get_all
};

