var http	= require("http"),
	https	= require("https"),
	url		= require("url"),
	query	= require("querystring");

http.createServer(function (request, response) {

	var requestData = url.parse(request.url),
		GET = query.parse(requestData.query),

		userAccessToken = GET.userAccessToken,
		captchaId = GET.captchaSid || "",
		captchaKey = GET.captchaKey || "";

	response.writeHead(200, {
		"Content-Type": "application/json; charset=utf-8",
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Credentials": true,
		"Access-Control-Allow-Methods": "HEAD, OPTIONS, GET, POST",
		"Access-Control-Allow-Headers": "Content-Type, User-Agent, X-Requested-With, If-Modified-Since, Cache-Control"
	});

	if (!GET.ts && !GET.key && !GET.server)
		getLongPollServer(response, userAccessToken, {id: captchaId, key: captchaKey});
	else
		waitForLongPoll(response, {ts: GET.ts, key: GET.key, server: GET.server});
}).listen(4000);


function getLongPollServer (response, token, captcha, n) {
	n = n || 0;

	var params = {
		v: 3,
		access_token: token
	};

	if (captcha) {
		params.captcha_sid = captcha.id;
		params.captcha_key = captcha.key;
	}

	try {
		API("messages.getLongPollServer", params, function (data) {
			if (!data)
				return n < 2 ? getLongPollServer(response, token, captcha, ++n) : response.end();

			if (!data.response) {
				if (data.error && data.error.error_code === 14) {
					return sendResponse(response, [null, {
						errorId: 3,
						description: "#14 - Captcha needed",
						captchaId: data.error.captcha_sid
					}]);
				}
				return sendResponse(response, [null, {
					errorId: 1,
					description: "Не удалось получить адрес для LongPoll сервера",
					original: data
				}]);
			}

			waitForLongPoll(response, data.response);

		}, response);
	} catch (e) {
		return sendResponse(response, [null, {
			errorId: 7,
			description: "Не удалось получить ответа от API ВКонтакте"
		}]);
	}
}

function waitForLongPoll(response, data) {
	var url = data.server.split("/"),
		host = url[0],
		path = "/" + url[1] + "?act=a_check&wait=15&mode=66&key=" + data.key + "&ts=" + data.ts;

	http.get({
		host: host,
		port: 80,
		path: path
	}, function(res) {
		var r = String();
		res.setEncoding("utf8");
		res.on("data", function(chunk) { r += chunk });
		res.on("end", function() {
			if (!r) {
				return sendResponse(response, [null, {
					errorId: 2,
					description: "LongPoll returns empty response"
				}]);
			}

			try {
				r = JSON.parse(r);
			} catch (e) {
				return sendResponse(response, [null, {
					errorId: 5,
					description: "NodeJS Exception: " + e.toString()
				}]);
			}

			if (r.failed) {
				return sendResponse(response, [null, {
					errorId: 3,
					description: "LongPoll returns failed"
				}]);
			}
			sendResponse(response, [r, {errorId: 0, server: data.server, key: data.key, ts: data.ts || r.ts}]);
		});
	}).on("error", function(e) {
		return sendResponse(response, [{}, {
			errorId: 8,
			description: "LongPoll handle error",
			error: e
		}]);
	});
}


function sendResponse(response, data) {
	if (!response) {
		return; // пошел нахуй
	}

	response.write(JSON.stringify(data));
	response.end();
}

function API(method, params, callback, response) {

	var options = {
		host: "api.vk.com",
		port: 443,
		path: "/method/" + method + "?" + buildHttpQuery(params),
		method: "GET"
	};

	https.get(options, function (res) {
		var apiResponse = String();
		res.setEncoding("utf8");

		res.on("data", function(chunk) {
			apiResponse += chunk;
		});

		res.on("end", function () {
			var o;
			try {
				o = JSON.parse(apiResponse);
			} catch (e) {
				callback(null);
			}
			callback(o);
		});
	}).on("error", function(e) {
		sendResponse(response, [null, {
			errorId: 7,
			description: "Cannot get response from VK",
			error: e
		}]);
	});
}

function buildHttpQuery(data) {
	var params = [];
	for (var item in data) {
		if (data.hasOwnProperty(item)) {
			params.push(item + "=" + encodeURIComponent(data[item]));
		}
	}
	return params.join("&");
}