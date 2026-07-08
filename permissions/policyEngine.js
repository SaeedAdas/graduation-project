const POLICIES = require('./policies');

function hasPermission(subject, resource, action, data = null) {
	if (!subject || !resource || !action) return false;
	
	// if multiple roles: user.roles.some((role) => {}); is needed
	
	const role = subject.role;

	const permission = POLICIES?.[role]?.[resource]?.[action];

	if(!permission) return false;

	if (typeof permission == 'boolean') {
		return permission;
	} else if (typeof permission == 'function') {
		return permission(subject, data);
	}

	return false;
};

module.exports = { hasPermission };
