const POLICIES = {
	Admin: {
		posts: {
			view: true,
			create: true,
			update: true,
			remove: true
		},
		comments: {
			view: true,
			create: true,
			update: true,
			remove: true
		},
		reactions: {
			view: true,
			create: true,
			update: true,
			remove: true
		},
		reports: {
			view: true,
			view_all: true,
			create: true,
			update: true,
			remove: true
		},
		categories: {
			view: true,
			view_all: true,
			create: true,
			update: true,
			remove: true
		},
		users: {
			view: true,
			view_all: true,
			create: true,
			update: true,
			remove: true
		},
		api: {
			view: true
		}
	},
	User: {
		posts: {
			view: true,
			create: true,
			update: (user, post) => user.id == post.userId,
			remove: (user, post) => user.id == post.userId
		},
		comments: {
			view: true,
			create: true,
			update: (user, comment) => user.id == comment.userId,
			remove: (user, comment) => user.id == comment.userId
		},
		reactions: {
			view: true,
			create: true,
			update: (user, reaction) => user.id == reaction.userId,
			remove: (user, reaction) => user.id == reaction.userId
		},
		reports: {
			view: (user, report) => user.id == report.userId,
			view_all: false,
			create: true,
			update: (user, report) => user.id == report.userId,
			remove: (user, report) => user.id == report.userId
		},
		categories: {
			view: true,
			view_all: true,
			create: false,
			update: false,
			remove: false
		},
		users: {
			view: (user, target_id) => user.id == target_id,
			view_all: false,
			create: false,
			update: (user, target_id) => user.id == target_id,
			remove: (user, target_id) => user.id == target_id
		},
		api: {
			view: false
		}
	}
};

module.exports = POLICIES;
