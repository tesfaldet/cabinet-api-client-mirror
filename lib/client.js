var superclient = require('superclient');

module.exports = superclient(function() {
	this.route('autoenrollments');
	this.route('login');

	this.resource('enrollments');
	this.resource('users');
	this.resource('courses');
});
