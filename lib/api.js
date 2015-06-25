var _ = require('lodash'),
	superagent = require('superagent'),
	superclient = require('superclient'),
	url = require('url'),
	Client = require('./client.js'),
	TagsClient = require('./tagsClient.js');

require('superagent-as-promised')(superagent);

var conf = null;
var api = null;
var tagsApi = null;
var authorizationHeader = '';

function setDefaults(req) {
	req.type('application/json');
	req.timeout(conf.timeout);
	req.set('authorization', authorizationHeader);
	return req;
}

function login() {
	return api.login.post()
		.send({
			username: conf.username,
			password: conf.password
		}).then(function(response) {
			authorizationHeader = response.headers.authorization;
		});
}

function checkAuthorized(promiseFunction) {
	return promiseFunction()
		.then(function(response) {
			return response;
		}, function(err) {
			if (err.status === 401 && conf.username) {
				return login()
					.then(function() {
						return promiseFunction();
					});
			}
			throw err;
		});
}

function unwrapResult(promiseFunction) {
	function callPromiseFunction(query) {
		return promiseFunction(query)
			.then(function(response) {
				if (response.statusCode === 200) {
					_.each(response.body.data, function(item) {
						items.push(item);
					});

					if (response.body.hasMore) {
						var query = url.parse(response.body.links.next, true).query;
						return callPromiseFunction(query);
					}
				}
			});
	}

	var items = [];
	return callPromiseFunction({})
		.return(items);
}

module.exports.passThroughAuthorization = function() {
	return function(req, res, next) {
		authorizationHeader = req.headers.authorization;
		next();
	};
}

module.exports.configure = function(apiConf) {
	conf = apiConf;

	api = new Client(conf.apiUrl, function(method, url) {
		return superagent[method](url)
			.use(setDefaults);
	});

	tagsApi = new TagsClient(conf.apiUrl + '/tags/', function(method, url) {
		return superagent[method](url)
			.use(setDefaults);
	});
};

module.exports.getUser = function(userId) {
	return checkAuthorized(function() {
		return api.users(userId).get();
	}).then(function(response) {
		return response.body;
	});
};

module.exports.getEnrollment = function(userId, courseId) {
	return checkAuthorized(function() {
		return api.enrollments(userId, courseId).get();
	}).then(function(response) {
		return response.body;
	});
};

module.exports.addEnrollment = function(userId, courseId, enrollerId) {
	return checkAuthorized(function() {
		return api.enrollments.post()
			.send({
				user: userId,
				course: courseId,
				enroller: enrollerId
			});
	}).then(function(response) {
		return response.body.data;
	});
};

module.exports.getExpandedTags = function(tags) {
	return checkAuthorized(function() {
		return tagsApi.expanded.get()
			.send({tags: tags});
	}).then(function(response) {
		return response.body;
	});
};

module.exports.getEnabledAutoEnrollments = function() {
	return checkAuthorized(function() {
		return unwrapResult(function(query) {
				return api.autoenrollments.get()
					.query({isEnabled: true})
					.query(query);
			});
	});
};

module.exports.getCourses = function(options) {
	return checkAuthorized(function() {
		return api.courses.get()
			.query(options);
	}).then(function(response) {
		return response.body;
	});
};
