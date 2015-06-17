var _ = require('lodash'),
	superagent = require('superagent'),
	superclient = require('superclient'),
	request = require('request-promise'),
	url = require('url'),
	Client = require('./client.js');

require('superagent-as-promised')(superagent);

var api = null;
var tagsApi = null;
var conf = null;
var baseRequest = null;
var bearerToken = '';
var apiResolvedUrl = '';

var TagsClient = superclient(function() {
	this.route('expanded');
});

function setDefaults(req) {
	req.type('application/json');
	req.timeout(conf.timeout);
	req.set('authorization', bearerToken);

	return req;
}

function login() {
	return api.login.post()
		.send({
			username: conf.username,
			password: conf.password
		}).then(function(response) {
			bearerToken = response.headers.authorization;
		}, function(err) {
			throw err;
		});
}

function checkAuthorized(promiseFunction) {
	return promiseFunction()
		.then(function(response) {
			return response;
		}, function(err) {
			if (err.statusCode === 401) {
				return login()
					.then(function() {
						return promiseFunction();
					});
			}
			throw err;
		});
}

function fetchPagedRoute(path, queryParams) {
	function callPagedRoute(path, queryParams, items) {
		return baseRequest({
			url: conf.apiUrl + path,
			method: 'GET',
			headers: {authorization: bearerToken},
			qs: queryParams,
			resolveWithFullResponse: true
		}).then(function(response) {
			if (response.statusCode !== 200) {
				console.log('Failed fetching from ' + path + ' with status code ' + response.statusCode);
			} else {
				_.each(response.body.data, function(item) {
					items.push(item);
				});
				if (response.body.hasMore) {
					return callPagedRoute(response.body.links.next, queryParams, items);
				}
			}
		});
	}
	var items = [];
	return callPagedRoute(conf.apiRoute + path, queryParams, items)
		.return(items);
}

module.exports.configure = function(apiConf) {
	conf = apiConf;
	apiResolvedUrl = conf.apiUrl + conf.apiRoute;

	baseRequest = request.defaults({
		json: true,
		timeout: conf.timeout
	});

	api = new Client(apiResolvedUrl, function(method, url) {
		return superagent[method](url)
			.use(setDefaults);
	});

	tagsApi = new TagsClient(apiResolvedUrl + '/tags/', function(method, url) {
		return superagent[method](url)
			.use(setDefaults);
	});
};

module.exports.getUser = function(userId) {
	return checkAuthorized(function() {
		return api.users(userId).get();
	}).then(function(response) {
		return response.body;
	}, function(err) {
		throw err;
	});
};

module.exports.getEnrollment = function(userId, courseId) {
	return checkAuthorized(function() {
		return api.enrollments(userId, courseId).get();
	}).then(function(response) {
		return response.body;
	}, function(err) {
		throw err;
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
	}, function(err) {
		throw err;
	});
};

module.exports.getExpandedTags = function(tags) {
	return checkAuthorized(function() {
		return tagsApi.expanded.get()
			.send({tags: tags});
	}).then(function(response) {
		return response.body;
	}, function(err) {
		throw err;
	});
};

module.exports.getAutoEnrollments = function() {
	return checkAuthorized(function() {
		return fetchPagedRoute('/autoenrollments', {isEnabled: true})
			.then(function(autoEnrollments) {
				return autoEnrollments;
			}, function(err) {
				throw err;
			});
	});
};
