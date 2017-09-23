/**
 * Return element from document with id=i
 * @param {String} i
 * @returns {HTMLElement|HTMLInputElement}
 */
function g(i) {
	return document.getElementById(i);
}

/**
 * Return object of values of form
 * @param {HTMLFormElement} form
 * @returns {object}
 */
function getFormParams(form) {
	var obj = {};
	for (var i = 0, l; l = form.elements.item(i); ++i) {
		obj[l.name] = getValue(l);
	}
	return obj;
}

/**
 * Get value from form element
 * @param {HTMLElement|String} node
 * @returns {String|Number|null}
 */
function getValue(node) {
	if (typeof node === "string") {
		node = g(node);
	}
	switch (node.tagName.toLowerCase()) {

		case "input":
			/** @var {HTMLInputElement} node */
			switch (node.type) {

				case "text":
				case "password":
				case "hidden":
				case "email":
					return node.value;

				case "checkbox":
					return parseInt(node.checked);

				default:
					return null;
			}
			break;

		case "select":
			/** @var {HTMLSelectElement} node */
			return node.options[node.selectedIndex].value;

	}
	return null;
}

/**
 * Build string query
 * @param {object|Array} array
 * @param {boolean=} noEncode
 * @returns {string}
 */
function httpBuildQuery(array, noEncode) {
	if (!array) {
		return "";
	}

	var data = [], key;
	for (key in array) {
		if (array.hasOwnProperty(key)) {
			data.push(noEncode ? key + "=" + array[key] : encodeURIComponent(key) + "=" + encodeURIComponent(array[key]));
		}
	}
	return data.join("&");
}

/**
 * Change in UI application name on form
 * @param {HTMLSelectElement} node
 */
function changeApplicationName(node) {
	g("applicationName").innerHTML = node.options[node.selectedIndex].innerHTML;
}

var CLASS_HIDDEN = "hidden",
	CLASS_ERROR = "error",
	CLASS_LOADER_BUTTON = "loader-button",
	ID_ERROR_BLOCK = "errorBlock",
	ID_FORM_SIMPLE = "authSimple",
	ID_FORM_CAPTCHA = "authCaptcha",
	ID_FORM_VALIDATION = "authValidation",
	ID_FORM_VALIDATION_SMS = "validationForm",
	ID_SUBMIT_MAIN = "submitMain",
	ID_SUBMIT_SMS = "submitSms",
	ID_CAPTCHA_ID = "captchaId",
	ID_CAPTCHA_KEY = "captchaKey",
	ID_CAPTCHA_IMAGE = "captchaImage",
	ID_VALIDATION_ID = "validationId",
	ID_VALIDATION_PHONE_MASK = "validationPhone",
//	ID_VALIDATION_CODE = "validationCode",
	ID_VALIDATION_TIME = "validationTime",
	errorTimer = -1,
	isRequested = false,
	expireDays = 120;

/**
 * Authorization
 * @param {HTMLFormElement} form
 * @param {Event} event
 * @returns {boolean}
 */
function authorize(form, event) {

	// Already request sent?
	if (isRequested) {
		return false;
	}

	isRequested = true;
	event.preventDefault();

	// take data
	var params = getFormParams(form);
	/**
	 * @var {{login, password, captchaId, captchaKey}} params
	 */

	if (params.login.length <= 5 || params.password.length < 5 || (params.captchaId && !params.captchaKey)) {
		showError("Не все поля заполнены!");
		isRequested = false;
		return false;
	}

	g(ID_SUBMIT_MAIN).disabled = true;

	APIdogRequest("authorize.do", params).then(function(data) {
		/**
		 * @var {{accessToken, authId, authKey, salt}} data
		 */
		isRequested = false;
		setCookie("userAccessToken", data.accessToken, expireDays);
		setCookie("authId", data.authId, expireDays);
		setCookie("authKey", data.authKey, expireDays);
		setCookie("salt", data.salt, expireDays);
		var btn = g(ID_SUBMIT_MAIN);
		btn.value = "Успех!";
		window.location.href = "./";
	}).catch(function(error) {

		/**
		 * @var {{reason: int, data: {errorId, extra: object=}}} error
		 */
		isRequested = false;
		g(ID_SUBMIT_MAIN).disabled = false;


		switch (error.reason) {
			case APIdogRequest.FAILED_CAUSE_HANDLE:
				switch (error.data.errorId) {
					case APIdogAPIErrorCodes.AUTHORIZE_HAS_ERROR:
					case APIdogAPIErrorCodes.AUTHORIZE_HAS_ERROR_WHILE_CHECK:
						setVisibility(ID_FORM_SIMPLE, true);
						setVisibility(ID_FORM_CAPTCHA, false);
						setVisibility(ID_FORM_VALIDATION, false);
						setVisibility(ID_SUBMIT_SMS, false);
						setVisibility(ID_SUBMIT_MAIN, true);
						showError("#" + error.errorId + ": " + error.message);
						break;

					case APIdogAPIErrorCodes.AUTHORIZE_HAS_ERROR_CAPTCHA:
						setVisibility(ID_FORM_SIMPLE, false);
						setVisibility(ID_FORM_CAPTCHA, true);
						setVisibility(ID_FORM_VALIDATION, false);
						setCaptcha(error.data.extra);
						break;

					case APIdogAPIErrorCodes.AUTHORIZE_HAS_ERROR_2FA:
						setVisibility(ID_FORM_SIMPLE, false);
						setVisibility(ID_FORM_CAPTCHA, false);
						setVisibility(ID_FORM_VALIDATION, true);
						setVisibility(ID_SUBMIT_MAIN, false);
						setValidation(error.data.extra);
						break;

					default:
						showError("UnexpectedError<" + error.errorId + ">: " + error.message);
				}
				break;

			case APIdogRequest.FAILED_CAUSE_SERVER_JSON:
				showError("Что-то пошло не так...");

				break;

			case APIdogRequest.FAILED_CAUSE_SERVER_5xx:
				showError("Кажется, у нас прилег сервер.");
				break;

			default:
				showError("Неизвестная ошибка");
		}
	});
	return false;
}

function setCaptcha(error) {
	g(ID_CAPTCHA_ID).value = error.captchaId;
	g(ID_CAPTCHA_IMAGE).src = !window.__userFromUkraine ? error.captchaImg : error.captchaImg.replace("api.vk.com", "apidog.ru:4006");
	setEmptyCaptchaKey();
}

function setCaptchaImage(node) {
	node.width = 130;
	node.height = 50;
	node.src += ~node.src.indexOf("rnd=") ? "1" : "&rnd=1";
	setEmptyCaptchaKey();
}

function setEmptyCaptchaKey() {
	g(ID_CAPTCHA_KEY).value = "";
	g(ID_CAPTCHA_KEY).focus();
	g(ID_CAPTCHA_IMAGE).removeAttribute("proxed");
}

/**
 * @param {{validationId, phone}} error
 */
function setValidation(error) {
	g(ID_VALIDATION_ID).value = error.validationId;
	g(ID_VALIDATION_PHONE_MASK).innerHTML = error.phone;
}

function sendValidationSMS() {
	var validationId = getValue(ID_VALIDATION_ID);
	setVisibilityLoaderButton(ID_SUBMIT_SMS, true);
	g(ID_VALIDATION_TIME).innerHTML = "";
	VKAPI("auth.validatePhone", {
		sid: validationId
	}, function(result) {
		setVisibilityLoaderButton(ID_SUBMIT_SMS, false);
		if (result.response) {
			setVisibility(ID_SUBMIT_SMS, false);
			setVisibility(ID_SUBMIT_MAIN, true);
			setVisibility(ID_SUBMIT_MAIN, true);
			setVisibility(ID_FORM_VALIDATION_SMS, true);
		}
	});
}

function setVisibility(id, state) {
	g(id).classList[state ? "remove" : "add"](CLASS_HIDDEN);
}

function setVisibilityLoaderButton(node, state) {
	node = typeof node === "string" ? g(node) : node;
	node.classList[state ? "add" : "remove"](CLASS_HIDDEN);
	node.nextElementSibling.classList[state ? "add" : "remove"](CLASS_LOADER_BUTTON);
}

function onErrorCaptcha(node) {
	if (node.getAttribute("proxed") || node.src === "about:blank") return;
	node.setAttribute("proxed", "yes");
	node.src = "\/api\/v2\/apidog.proxyData?t=png&u=" + encodeURIComponent(node.src);
}

/**
 * Request to APIdog API
 * @param {string} method
 * @param {object} params
 * @returns {Promise}
 * @constructor
 */
function APIdogRequest(method, params) {
	params = params || {};

	return new Promise(function(resolve, reject) {
		var xhr = new XMLHttpRequest(),
			postFields = httpBuildQuery(params);

		xhr.open("POST", "api-v3.php?method=" + method, true);

		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

		xhr.onreadystatechange = function() {
			if (xhr.DONE === xhr.readyState) {
				if (xhr.status === 200) {
					try {
						var json = JSON.parse(xhr.responseText);

						if (!("result" in json) || json.error) {
							reject({data: json.error, reason: APIdogRequest.FAILED_CAUSE_HANDLE});
							return;
						}

						resolve(json.result);
					} catch (exc) {
						reject({data: null, reason: APIdogRequest.FAILED_CAUSE_SERVER_JSON});
					}
				} else {
					reject({data: null, reason: APIdogRequest.FAILED_CAUSE_SERVER_5xx});
				}
			}
		};
		xhr.send(postFields);
	});
}

APIdogRequest.FAILED_CAUSE_SERVER_5xx = 0xDEAD;
APIdogRequest.FAILED_CAUSE_SERVER_JSON = 0xBADF00D;
APIdogRequest.FAILED_CAUSE_HANDLE = 0xC001;

var APIdogAPIErrorCodes = {
	UNKNOWN_METHOD: 1,
	INVALID_PARAM: 2,
	INTERNAL_DATABASE_ERROR: 3,
	AUTHORIZE_HAS_ERROR: 5,
	AUTHORIZE_TOKEN_EMPTY: 6,
	AUTHORIZE_HAS_ERROR_WHILE_CHECK: 7,
	AUTHORIZE_HAS_ERROR_INVALID_CLIENT: 8,
	AUTHORIZE_HAS_ERROR_CAPTCHA: 9,
	AUTHORIZE_HAS_ERROR_2FA: 10,
	AUTHORIZE_HAS_ERROR_INVALID_APPLICATION: 11,
	AUTH_KEY_INVALID: 15
};

var APIdogAuthCallback = [];

function VKAPI(method, params, callback) {
	if (typeof callback === "function") {
		var now = APIdogAuthCallback.length;
		APIdogAuthCallback[now] = callback;
		callback = "APIdogAuthCallback[" + now + "]";
	}
	params = params || {};
	params.callback = callback;
	if (!params.v) params.v = 4.99;
	var url = [],
		key, f = encodeURIComponent;
	for (key in params) {
		if (params.hasOwnProperty(key)) {
			url.push(f(key) + "=" + f(params[key]));
		}
	}
	url = url.join("&");
	var elem = document.createElement("script");
	elem.type = "text/javascript";
	elem.addEventListener("load", function() {
		elem.parentNode.removeChild(elem);
		if (elem.remove) elem.remove();
	});
	elem.src = "https://" + (!window.__userFromUkraine ? "api.vk.com" : "apidog.ru:4006") + "/method/" + method + "?" + url;
	document.getElementsByTagName("head")[0].appendChild(elem);
}

function showError(text) {
	var block = g(ID_ERROR_BLOCK);
	block.classList.add(CLASS_ERROR);
	block.innerHTML = text;
	if (errorTimer >= 0) {
		clearTimeout(errorTimer);
	}
	errorTimer = setTimeout(function() {
		block.classList.remove(CLASS_ERROR);
	}, 5000);
}

function setCookie(key, value, days) {
	if (!key || (/^(?:expires|max-age|path|domain|secure)$/i).test(key)) {
		return false;
	}
	days = days || 30;
	var expires = new Date(Date.now() + (1000 * days * 60 * 60 * 24)).toUTCString();
	document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(value) + "; path=/; expires=" + expires;
	return true;
}

window.addEventListener("load", function() {
	setTimeout(window.scrollTo.bind(window, 0, 1), 0);
}, false);