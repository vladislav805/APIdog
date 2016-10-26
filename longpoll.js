/**
 * APIdog v6.5
 *
 * LongPoll server
 */

/**
 * Формат ответа от Proxy LongPoll Server:
 * [
 *     int status,
 *     object response,
 *     object extra
 * ]
 *
 * status:
 *     0 - удачный запрос
 *     1 - vk: ошибка при получении адреса для сервера (captcha)
 *     2 - vk: ошибка при получении адреса для сервера (vk)
 *     3 - vk: ошибка при получении адреса для сервера (vk is down)
 *     4 - longpoll: пустой ответ
 *     5 - longpoll: ошибка парсинга ответа
 *     6 - longpoll: failed
 *     7 - longpoll: onError
 *
 * response:
 *     int ts
 *     array updates
 *
 * extra: свободный формат
 */

var http	= require("http"),
	https	= require("https"),
	url		= require("url"),
	querystring	= require("querystring"),

	APIDOG_LONGPOLL_RESULT_CODE_OK = 0,
	APIDOG_LONGPOLL_RESULT_CODE_CAPTCHA = 1,
	APIDOG_LONGPOLL_RESULT_CODE_API_ERROR = 2,
	APIDOG_LONGPOLL_RESULT_CODE_SERVER_ISSUE = 3,
	APIDOG_LONGPOLL_RESULT_CODE_EMPTY_RESPONSE = 4,
	APIDOG_LONGPOLL_RESULT_CODE_NOT_JSON = 5,
	APIDOG_LONGPOLL_RESULT_CODE_FAILED = 6,
	APIDOG_LONGPOLL_RESULT_CODE_API_REQUEST_UNKNOWN = 7,

	LP_MODE_ATATCHS = 2,
	LP_MODE_EXTENDS = 8,
	LP_MODE_PTS = 32,
	LP_MODE_EXTRA_FRIENDS = 64,
	LP_MODE_RANDOM_ID = 128,

	LP_VERSION_NORMAL = 0,
	LP_VERSION_GROUP_NEGATIVE = 1,




	config = {
		version: LP_VERSION_GROUP_NEGATIVE,
		mode: LP_MODE_ATATCHS | LP_MODE_EXTENDS | LP_MODE_EXTRA_FRIENDS | LP_MODE_RANDOM_ID
	},

	server = http.createServer(function(request, response) {

		var requestData = url.parse(request.url),
			path = requestData.pathname,
			GET = querystring.parse(requestData.query),

			userAccessToken = GET.userAccessToken,
			captchaId = GET.captchaSid,
			captchaKey = GET.captchaKey;

		response.writeHead(200, {
			"Content-Type": "application/json; charset=utf-8",
			"Access-Control-Allow-Origin": "https://apidog.ru",
			"Access-Control-Allow-Credentials": true,
			"Access-Control-Allow-Methods": "HEAD, OPTIONS, GET, POST",
			"Access-Control-Allow-Headers": "Content-Type, User-Agent, X-Requested-With, If-Modified-Since, Cache-Control",
			"X-APIdog-Config": "v: " + config.version + "; mode: " + config.mode
		});

		if (!GET.ts && !GET.key && !GET.server) {
			getLongPollServer(response, userAccessToken, {id: captchaId, key: captchaKey});
		} else {
			waitForLongPoll(response, {ts: GET.ts, key: GET.key, server: GET.server});
		};
	}).listen(4000);


/**
 * Запрос адреса LongPoll-сервера
 * @param  {Object} response           Объект для ответа
 * @param  {String} userAccessToken    Пользовательский токен
 * @param  {Object} captcha            Данные капчи
 * @param  {Number} n                  Номер попытки
 */
function getLongPollServer(response, userAccessToken, captcha, n) {
	n = n || 0;

	var params = {
		v: 4.104,
		access_token: userAccessToken
	};

	if (captcha) {
		params.captcha_sid = captcha.id;
		params.captcha_key = captcha.key;
	};

	try {
		API("messages.getLongPollServer", params, function(data) {
			if (!data) {
				return n < 2 ? getLongPollServer(response, userAccessToken, captcha, ++n) : response.end();
			};

			if (!data.response) {
				if (data.error && data.error.error_code == 14) {
					return outputJSON(response, [APIDOG_LONGPOLL_RESULT_CODE_CAPTCHA, null, {
						captchaId: data.error.captcha_sid,
						captchaImg: data.error.captcha_img
					}]);
				};
				return outputJSON(response, [APIDOG_LONGPOLL_RESULT_CODE_API_ERROR, null, { source: data.error } ] );
			};

			waitForLongPoll(response, data.response);
		}, response);
	} catch (e) {
		return outputJSON(response, [APIDOG_LONGPOLL_RESULT_CODE_SERVER_ISSUE, null, {  }]);
	};
};

/**
 * Висячий процесс запроса LongPoll
 * @param  {Object} response Объект для ответа
 * @param  {Object} data     Объект с данными для запроса
 */
function waitForLongPoll(response, data) {
	var url = data.server.split("/"),
		host = url[0],
		path = "/" + url[1] + "?" + querystring.stringify({
			act: "a_check",
			wait: 15,
			mode: config.mode,
			key: data.key,
			ts: data.ts,
			version: config.version
		});

	http.get({
		host: host,
		port: 80,
		path: path
	}, function(result) {
		var json = new String();
		result.setEncoding("utf8");

		result.on("data", function(chunk) {
			json += chunk;
		});

		result.on("end", function() {
			if (!json) {
				return outputJSON(response, [APIDOG_LONGPOLL_RESULT_CODE_EMPTY_RESPONSE, null, { }]);
			};

			try {
				json = JSON.parse(json);
			} catch (e) {
				return outputJSON(response, [APIDOG_LONGPOLL_RESULT_CODE_NOT_JSON, null, { reason: e.toString() }]);
			};

			if (json.failed) {
				return outputJSON(response, [APIDOG_LONGPOLL_RESULT_CODE_FAILED, null, { failed: json.failed }]);
			};

			outputJSON(response, [APIDOG_LONGPOLL_RESULT_CODE_OK, json, {server: data.server, key: data.key, ts: data.ts || json.ts}]);
		});
	}).on("error", function(e) {
		return outputJSON(response, [APIDOG_LONGPOLL_RESULT_CODE_API_REQUEST_UNKNOWN, null, {}]);
	}).setTimeout(25000, function() {
		return outputJSON(response, [APIDOG_LONGPOLL_RESULT_CODE_FAILED, null, {  }]);
	});
};

/**
 * Вывод ответа в JSON
 * @param  {Object} response Объект ответа
 * @param  {Object} data     Данные для вывода
 */
function outputJSON(response, data) {
	data.push({v: 2});
	response.write(JSON.stringify(data));
	response.end();
};

/**
 * Запрос к API
 * @param {String}   method   Метод
 * @param {Object}   params   Параметры
 * @param {Function} callback Обработчик
 * @param {Object}   response Объект ответа
 */
function API(method, params, callback, response) {

	var options = {
		host: "api.vk.com",
		port: 443,
		path: "/method/" + method + "?" + querystring.stringify(params),
		method: "GET"
	};

	https.get(options, function(res) {
		var apiResponse = new String();
		res.setEncoding("utf8");

		res.on("data", function(chunk) {
			apiResponse += chunk;
		});

		res.on("end", function() {
			try {
				apiResponse = JSON.parse(apiResponse);
				callback(apiResponse);
			} catch (e) {
				callback(null);
			};
		});
	}).on("error", function(e) {
		return outputJSON(response, [APIDOG_LONGPOLL_RESULT_CODE_SERVER_ISSUE, null, {}]);
	}).setTimeout(7500, function() {
		outputJSON(response, [APIDOG_LONGPOLL_RESULT_CODE_SERVER_ISSUE, null, {}]);
	});
};
