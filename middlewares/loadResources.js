const prisma = require("../config/connection");
const messages = require("../helper/messages");

const loadPost = async (req, res, next) => {
	try {
		const id = req.params.id || req.params.post_id;
		
		const post = await prisma.post.findUnique({where:{ id }});

		if (!post) {
			return messages.notFound(res, "Post not found");
		}
	
		req.data = post;

		next();
	} catch (error) {
		console.error("Error loading post: ", error);

		return messages.serverError(res);
	}
}

const loadComment = async (req, res, next) => {
	try {
		const id = req.params.id;
		
		const comment = await prisma.comment.findUnique({where:{ id }});

		if (!comment) {
			return messages.notFound(res, "Comment not found");
		}
	
		req.data = comment;

		next();

	} catch (error) {
		console.error("Error loading comment: ", error);

		return messages.serverError(res);
	}
}

const loadReport = async (req, res, next) => {
	try {
		const id = req.params.id;
		
		const report = await prisma.report.findUnique({where:{ id }});

		if (!report) {
			return messages.notFound(res, "Report not found");
		}
	
		req.data = report;

		next();
	} catch (error) {
		console.error("Error loading report: ", error);

		return messages.serverError(res);
	}
}

const loadReaction = async (req, res, next) => {
	try {
		const id = req.params.id;
		
		const reaction = await prisma.reaction.findUnique({where:{ id }});

		if (!reaction) {
			return messages.notFound(res, "Reaction not found");
		}
	
		req.data = reaction;

		next();
	} catch (error) {
		console.error("Error loading reaction: ", error);

		return messages.serverError(res);
	}
}

const loadCategory = async (req, res, next) => {
	try {
		const id = req.params.id;
		
		const category = await prisma.post.findUnique({where:{ id }});

		if (!category) {
			return messages.notFound(res, "Category not found");
		}
	
		req.data = category;

		next();
	} catch (error) {
		console.error("Error loading category: ", error);

		return messages.serverError(res);
	}
}

module.exports = {
	loadPost,
	loadComment,
	loadReport,
	loadReaction,
	loadCategory
};
