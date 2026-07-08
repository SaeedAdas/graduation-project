const messages = require('../helper/messages');
const { hasPermission } = require("../permissions/policyEngine");

function authorize(resource, action) {
	return function (req, res, next) {

		const id = req.user.id;
		const role = req.user.role;

		const user = {id, role};
		const data = req.data || null;
	
		const allowed = hasPermission(user, resource, action, data);

		if (!allowed) {
			return messages.Unauthorized(res);
		}

		next();
	}

}

module.exports = { authorize };
