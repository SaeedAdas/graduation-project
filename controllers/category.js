const prisma = require("../config/connection");
const messages = require("../helper/messages");


const create = async (req, res) => {
	try {
		const { name, description } = req.body;	

		const category = await prisma.category.create({
			data: {
				name, 
				description 
			}
		});

		return messages.createdSuccessfully(res, "Category Saved Successfully");

	} catch (error) {
		console.error("Saving category error: ", error);
			
		// catches unqiue names
		if (
      			error instanceof Prisma.PrismaClientKnownRequestError &&
      			error.code === "P2002"
    		) {
      			return messages.alreadyExists(res, "Category name already exists");
    		}

		return messages.serverError(res);
	}
};

/*
const retrieve = async (req, res) => {
	const category = req.data;

	res.json(category);
};
*/

const get_all = async (req, res) => {
	try {

		let { page, limit, search } = req.query;
		
		// where clause should be retrieved from an authorization query scope engine
		const authorizationWhere = {
		};

		const criteria = {

		};

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
			]
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
		}

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
		if (
      			error instanceof Prisma.PrismaClientKnownRequestError &&
      			error.code === "P2002"
    		) {
      			return messages.alreadyExists(res, "Category name already exists");
    		}
		console.error("Updating category error: ", error);

		return messages.serverError(res);
	}
};

const remove = async (req, res) => {
	try {
		const id = req.params.id;

		await prisma.category.delete({where: {id}});

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
