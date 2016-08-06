document.addEventListener("load", function(event) {
	setTimeout(function () {
		window.scrollTo(0, 1);
	}, 0);
}, false);

/**
 * Получить DOMNode по id
 * @param  {String} id ID
 * @return {DOMNode}   Элемент с ID=id
 */
function g(id) {
	return document.getElementById(id);
};

/**
 * Изменяет в UI название выбранного приложения
 * @param  {DOMNode} node Селект
 */
function changeApplicationName (node)
{
	g("applicationName").innerHTML = node.options[node.selectedIndex].innerHTML;
};

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
	ID_VALIDATION_CODE = "validationCode",
	ID_VALIDATION_TIME = "validationTime",
	errorTimer = undefined,
	isLoad = false,
	expireDays = 120;

/**
 * Обработчик отправки формы авторизации
 * @param  {DOMNode}  form  Форма
 * @param  {DOMEvent} event Событие
 * @return {Boolean}        false
 */
function authorize(form, event) {
	if (isLoad) {
		return false;
	};

	isLoad = true;
	event.preventDefault();

	var login = getValue(form.username).trim(),
		password = getValue(form.password).trim(),
		application = getValue(form.application),

		captchaId = getValue(form.captchaId),
		captchaKey = getValue(form.captchaKey).trim(),

		validationId = getValue(form.validationId).trim(),
		validationCode = getValue(form.validationCode).trim(),

		params = {},

		btn = g(ID_SUBMIT_MAIN);;

	if (login.length <= 5 || password.length < 5 || (captchaId && !captchaKey)) {
		isLoad = false;
		showError("Не все поля заполнены!");
		return false;
	};

	params.login = login;
	params.password = password;
	params.application = application;

	if (captchaId) {
		params.captchaId = captchaId;
		params.captchaKey = captchaKey;
	};

	if (validationId && validationCode) {
		params.validationId = validationId;
		params.validationCode = validationCode;
	};

	btn.disabled = true;

	new API("apidog.authorize", params,
	function(data) {
		isLoad = false;
		btn.disabled = false;

		// new format
		setCookie("userAccessToken", data.userAccessToken, expireDays);
		setCookie("authId", data.authId, expireDays);
		setCookie("authKey", data.hash, expireDays);

		var btn = g(ID_SUBMIT_MAIN);
		btn.disabled = true;
		btn.value = "Успех!";
		window.location.href = "/";
	},
	function(type, error) {
		isLoad = false;
		btn.disabled = false;
		if (type == API.API_ERROR) {
			switch (error.errorId) {
				case 70:
				case 72:
					setVisibility(ID_FORM_SIMPLE, true);
					setVisibility(ID_FORM_CAPTCHA, false);
					setVisibility(ID_FORM_VALIDATION, false);
					setVisibility(ID_SUBMIT_SMS, false);
					setVisibility(ID_SUBMIT_MAIN, true);
					showError("#" + error.errorId + ": " + error.message);
					break;

				case 73:
					setVisibility(ID_FORM_SIMPLE, false);
					setVisibility(ID_FORM_CAPTCHA, true);
					setVisibility(ID_FORM_VALIDATION, false);
					setCaptcha(error);
					break;

				case 74:
					setVisibility(ID_FORM_SIMPLE, false);
					setVisibility(ID_FORM_CAPTCHA, false);
					setVisibility(ID_FORM_VALIDATION, true);
					setVisibility(ID_SUBMIT_MAIN, false);
					setValidation(error);
					break;

				default:
					showError("UnexpectedError<" + error.errorId + ">: " + error.message);
			};
		} else {
			showError("У Вас соединение с Интернетом, случаем, не пропало?");
		};
	}).send();

	return false;
};

/**
 * Заменяет данные капчи
 * @param {Object} error Объект ошибки
 */
function setCaptcha(error) {
	g(ID_CAPTCHA_ID).value = error.captchaId;
	g(ID_CAPTCHA_IMAGE).src = error.captchaImg;
	setEmptyCaptchaKey();
};

/**
 * Заменяет изображение капчи в UI
 * @param {DOMNode} node Элемент изображения
 */
function setCaptchaImage(node) {
	node.src += ~node.src.indexOf("rnd=") ? "1" : "&rnd=1";
	setEmptyCaptchaKey();
};

/**
 * Очищает поле капчи
 */
function setEmptyCaptchaKey() {
	g(ID_CAPTCHA_KEY).value = "";
	g(ID_CAPTCHA_KEY).focus();
	g(ID_CAPTCHA_IMAGE).removeAttribute("proxed");
};

/**
 * Очищает капчу
 */
function clearCaptcha() {
	g(ID_CAPTCHA_KEY).value = "";
	g(ID_CAPTCHA_ID).value = "";
};

/**
 * Заполняет поля валидации по объекту ошибки
 * @param {Object} error Объект ошибки
 */
function setValidation(error) {
	g(ID_VALIDATION_ID).value = error.validationId;
	g(ID_VALIDATION_PHONE_MASK).innerHTML = error.phone;
};

/**
 * Запрашивает отправку СМС для прохождения валидации
 * @param  {DOMNode} node Кнопка
 */
function sendValidationSMS(node) {
	var validationId = getValue(ID_VALIDATION_ID);
	setVisibilityLoaderButton(ID_SUBMIT_SMS, true);
	g(ID_VALIDATION_TIME).innerHTML = "";
	VKAPI("auth.validatePhone", { sid: validationId }, function(result) {
		setVisibilityLoaderButton(ID_SUBMIT_SMS, false);
		if (result.response) {
			setVisibility(ID_SUBMIT_SMS, false);
			setVisibility(ID_SUBMIT_MAIN, true);
			setVisibility(ID_FORM_VALIDATION_SMS, true);
		};
	});
};

/**
 * Меняет видимость элемента
 * @param {String}  id    ID элемента
 * @param {Boolean} state true для показа, false для скрытия
 */
function setVisibility(id, state) {
	g(id).classList[state ? "remove" : "add"](CLASS_HIDDEN);
};

/**
 * Показывает/скрывает лоадер на кнопке
 * @param {DOMNode} node  [description]
 * @param {Boolean} state [description]
 */
function setVisibilityLoaderButton(node, state) {
	node = typeof node === "string" ? g(node) : node;
	node.classList[state ? "add" : "remove"](CLASS_HIDDEN);
	node.nextElementSibling.classList[state ? "add" : "remove"](CLASS_LOADER_BUTTON);
};

/**
 * Обработчик ошибки загрузки изображения
 * @param  {[type]} node [description]
 * @return {[type]}      [description]
 */
function onErrorCaptcha (node)
{
	if (node.getAttribute("proxed") || node.src == "about:blank")
		return;
	node.setAttribute("proxed", "yes");
	node.src = "\/api\/v2\/apidog.proxyData?t=png&u=" + encodeURIComponent(node.src);
};

/**
 * Запрос к API
 * @param {String}   method   Метод
 * @param {Object}   params   Параметры для запроса
 * @param {Function} callback Обработчик ответа
 * @param {Function} fallback Обработчик ошибки
 */
function API (method, params, callback, fallback)
{
	var self = this;
	this.method = method;
	this.params = params;
	this.callback = callback;
	this.fallback = fallback;

	this._init();
};
API.INCORRECT_STATUS = 1;
API.REQUEST_ERROR = 2;
API.API_ERROR = 3;
API.prototype._init = function ()
{
	var xhr = new XMLHttpRequest(), self = this;
	xhr.onreadystatechange = function ()
	{
		if (xhr.readyState !== 4)
			return;
		if (xhr.status !== 200)
		{
			return self.fallback(API.INCORRECT_STATUS, xhr);
		};
		var data;
		try
		{
			data = JSON.parse(xhr.responseText);
		}
		catch (e)
		{
			data = null;
		}
		finally
		{
			self.result = data;
			self.onResult();
		};
	};
	this.xhr = xhr;
};
API.prototype._params = function ()
{
	var data = [], key, f = encodeURIComponent;
	for (key in this.params)
		data.push(f(key) + "=" + f(this.params[key]));
	return data.join("&");
};
API.prototype.send = function ()
{
	this.xhr.open("POST", "/api/v2/" + this.method);
	var body = this._params();
	this.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	this.xhr.send(body);
};
API.prototype.onResult = function ()
{
	if (!this.result)
		return this.fallback(API.REQUEST_ERROR, xhr);
	if (this.result.response && !this.result.response.errorId)
	{
		this.callback(this.result.response);
	}
	else if (this.fallback)
	{
		this.fallback(API.API_ERROR, this.result.response);
	};
};

var APIdogAuthCallback = [];


function VKAPI (method, params, callback) {
	if (typeof callback === "function") {
		var now = APIdogAuthCallback.length;
		APIdogAuthCallback[now] = callback;
		callback = "APIdogAuthCallback[" + now + "]";
	};
	params = params || {};
	params.callback = callback;
	if (!params.v)
		params.v = 4.99;
	var url = [], key, f = encodeURIComponent;
	for (key in params)
		url.push(f(key) + "=" + f(params[key]));
	url = url.join("&");
	var elem = document.createElement("script");
	elem.type = "text/javascript";
	elem.addEventListener("load", function (event) {
		elem.parentNode.removeChild(elem);
		if (elem.remove) elem.remove();
	});
	elem.src = "https://api.vk.com/method/" + method + "?" + url;
	document.getElementsByTagName("head")[0].appendChild(elem);
};

/**
 * Показывает ошибку на странице под формой
 * @param  {String} text Текст
 */
function showError (text)
{
	var block = g(ID_ERROR_BLOCK);
	block.classList.remove(CLASS_ERROR);
	block.innerHTML = text;
	block.classList.add(CLASS_ERROR);

	if (errorTimer !== undefined) {
		clearTimeout(errorTimer);
	};

	errorTimer = setTimeout(function () {
		block.classList.remove(CLASS_ERROR);
	}, 5000);
};

/**
 * Возвращает значение из элемента формы
 * @param  {[type]} node [description]
 * @return {[type]}      [description]
 */
function getValue (node) {
	if (typeof node === "string") {
		node = g(node);
	};

	switch (node.tagName.toLowerCase()) {
		case "input":
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
			};
			break;

		case "select":
			return node.options[node.selectedIndex].value;
	};
	return null;
};

/**
 * Изменяет cookies
 * @param {String} key   Метка
 * @param {String} value Значение
 * @param {Number} days  Количество дней для хранения
 */
function setCookie (key, value, days) {
	if (!key || /^(?:expires|max\-age|path|domain|secure)$/i.test(key)) {
		return false;
	};
	days = days || 30;
	var expires = new Date(Date.now() + (1000 * days * 60 * 60 * 24)).toUTCString();
	document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(value) + "; path=/; expires=" + expires;
    return true;
};

/**
 * Получение cookie
 * @param  {String} key Метка
 * @return {String}     Значение
 */
function getCookie (key) {
	return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
};

/**
 * Удаление cookie
 * @param  {String} key Метка
 */
function removeCookie (key) {
	setCookie(key, null, -1);
};

/**
 * Проверяет, есть ли cookie
 * @param  {String}  key Метка
 * @return {Boolean}     true, если есть
 */
function hasCookie (key) {
	return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
};