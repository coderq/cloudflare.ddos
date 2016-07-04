/**
 * 
 * @Author zhangyq (zhangyq_wb@os.ucweb.com)
 * @Date   2016-07-01
 * 
 */
'use strict';

var assert = require('assert');
var URL = require('url');
var request = require('request');

var headers = {
	'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.76 Mobile Safari/537.36'
};

var obj2query = function(obj) {
    if (typeof obj !== 'object') return '';
    return Object.keys(obj).map(function(key) {
        return key + (obj[key] !== void 0 ? '=' + obj[key] : '');
    }).join('&');
};

var getParam = function(body, host) {
	var jschl_vc = body.match(/name=\"jschl_vc\"\s+value=\"([^\"]+)\"/);
	var pass = body.match(/name=\"pass\"\s+value=\"([^\"]+)\"/);
	var answer;
	var url = body.match(/id=\"challenge-form\"\s+action=\"([^\"]+)\"/);
	var ov = body.match(/(\w+)\=\{\"(\w+)\"\:([\+\!\[\]\(\)]+)\};/);
	var iv = body.match(/(;\w+\.\w+[\%\*\/\-\+]\=[\+\!\[\]\(\)]+)+;/);
	var code = 'var ' + ov[1] + ';' + ov[0] + iv[0] + ';return ' + ov[1] + '.' + ov[2] + ';';
	var fn = new Function(code);

	return {
		url: url[1],
		param: {
			jschl_vc: jschl_vc[1],
			pass: pass[1],
			jschl_answer: fn() + host.length	
		}
	};
};

var doRequest = function(opts, _time, cb) {
	var url = opts.url,
		headers = opts.headers,
		time = opts.time;

	request({
		url: url,
		headers: headers,
		jar: true
	}, function(err, res, body) {
		if (err) {
			cb && cb(err);
			return;
		};

		console.log(res.statusCode);
		switch (res.statusCode) {
			case 503:
				var param = getParam(body, URL.parse(url).host);
				opts.url = URL.resolve(url, param.url + '?' + obj2query(param.param));

				if (_time > opts.time) {
					cb && cb(Error('Request failed. The Request time is more than ' + opts.time));
				} else {
					setTimeout(function() {
						doRequest(opts, _time + 1, cb);
					}, opts.frequency);	
				}
				
				break;
			
			case 200:
				cb && cb(null, body, res.req._headers.cookie);
				break;
			
			default:
				cb && cb(Error('Get an unknown status code `'+ res.statusCode +'`.'));
		}
	});
};

var run = function(url, cb) {
	var opts = {
		headers: headers,
		time: 20,
		frequency: 4000
	};
	if (typeof url === 'string') {
		opts.url = url;
	}
	if (typeof url === 'object') {
		Object.assign(opts, url);
	}

	assert.equal(typeof opts.url, 'string', 'The value of `url` option is invalid.');
	assert.ok(opts.frequency >= 3000, 'The value of `frequency` option should not less than 3000.');

	var _time = 0;

	doRequest(opts, _time, cb);
};

module.exports = run;
