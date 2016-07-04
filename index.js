'use strict';

const run = require('./core');
const site = 'http://www.albawabhnews.com/';

run(site, function(err, data) {
	if (err) throw err;
	console.log(data);
});