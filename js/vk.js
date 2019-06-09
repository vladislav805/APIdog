/**
 * Request to API VK
 * @param {string} method
 * @param {object=} params
 * @returns {Promise}
 */
function api(method, params) {
	return new Promise(function(resolve, reject) {
		var request = new api.fx.request(method, params || {});

		api.fx.perform(request.onResult(resolve).onError(reject));
	});
}

api.VERSION_FRESH = "5.96";
api.VERSION_LOWER = "5.26";
api.VERSION_DEPRECATED_PRIVACY = "5.29"; // 5.30+ - new privacy
api.VERSION_PEER_ID_SUPPORTED = "5.38"; // 5.38+ - peer_id in messages.*
api.VERSION_DEPRECATED_DOCUMENT_PREVIEW = "5.43"; // 5.44+ - preview object
api.VERSION_DEPRECATED_STICKER_FORMAT = "5.73"; // 5.74+ - new format
api.VERSION_DEPRECATED_PHOTO_FORMAT = "5.76"; // 5.77+ - new photo format
// 5.80+ - new methods for messages.* (conversation)
// 5.85+ - new polls
// 5.92+ - new comments tree

api.fx = {

	sRequests: [],

	incrementId: function() {
		return api.fx.sRequests.length++;
	},

	/**
	 * Constructor method object
	 * @param {string} method
	 * @param {object} params
	 */
	request: function(method, params) {
		this.mRequestId = api.fx.incrementId();
		this.mMethod = method;
		this.mParams = params;
		this.mResult = null;
		this.mOnResult = null;
		this.mOnError = null;
	},

	/**
	 * Executor for API requests
	 * @param {api.fx.request} om
	 */
	perform: function(om) {
		var p = om.getParams();

		api.fx.sRequests[om.getRequestId()] = om;

		if (!p.v) {
			p.v = api.VERSION_LOWER; // was 4.99
		}

		p.lang = 0; // todo: send real language
		p.https = 1;
		p.access_token = API.accessToken;

		var url = httpBuildQuery(p);

		if (API.extension && API.extension.versionSDK >= 1.3 && API.extension.versionSDK < 3.0) {
			api.fx.performExtension(om);
		} else if (isEnabled(Setting.USING_PROXY) || url.length > 4096 - 38) {
			api.fx.performProxy(om);
		} else {
			api.fx.performScript(om);
		}

	},

	/**
	 * Sending request via APIdog proxy
	 * @param {api.fx.request} om
	 */
	performProxy: function(om) {
		var url = "//apidog.ru:4006/method/" + om.getMethod();
		if (false && typeof window.fetch === "function") {
			// TODO III
		} else {
			var xhr = new XMLHttpRequest();
			xhr.open("POST", url);
			xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && xhr.status === 200) {
					var json = JSON.parse(xhr.responseText);
					om.notify(json);
				}
			};
			xhr.send(httpBuildQuery(om.getParams()));
		}
	},

	/**
	 * Sending request via APIdog Plus extension
	 * @param {api.fx.request} om
	 */
	performExtension: function(om) {
		api.fx.sRequests[om.getRequestId()] = function(res) {
			om.notify(res);
		};
		sendEvent("onAPIRequestExecute", {
			requestMethod: om.getMethod(),
			requestParams: om.getParams(),
			requestId: om.getRequestId()
		});
	},

	/**
	 * Sending request by basic method: via <script>
	 * @param {api.fx.request} om
	 */
	performScript: function(om) {
		var p = om.getParams();
		api.fx.sRequests[om.getRequestId()] = function(res) {
			om.notify(res);
		};

		p.callback = "api.fx.sRequests[" + om.getRequestId() + "]";

		var url = httpBuildQuery(p),
			elem = document.createElement("script"),
			query = "/method/" + om.getMethod() + "?" + url,
			sig = md5(query);

		elem.type = "text/javascript";

		elem.addEventListener("load", function() {
			$.elements.remove(elem);
		});

		elem.addEventListener("error", function() {
			console.error("vk.js: performScript: error while request to VK: " + om.toString());
			$.elements.remove(elem);
		});


		elem.src = "https://api.vk.com" + query + "&sig=" + sig;
		document.getElementsByTagName("head")[0].appendChild(elem);
	}

};

api.fx.request.prototype = {

	/**
	 * @returns {int}
	 */
	getRequestId: function() {
		return this.mRequestId;
	},

	/**
	 * @returns {string}
	 */
	getMethod: function() {
		return this.mMethod;
	},

	/**
	 * @returns {object}
	 */
	getParams: function() {
		return this.mParams;
	},

	/**
	 * @returns {object}
	 */
	getResult: function() {
		return this.mResult;
	},

	/**
	 * @param {function} fx
	 * @param {function?} context
	 * @returns {api.fx.request}
	 */
	onResult: function(fx, context) {
		this.mOnResult = context ? fx.bind(context) : fx;
		return this;
	},

	/**
	 * @param {function} fx
	 * @param {function?} context
	 * @returns {api.fx.request}
	 */
	onError: function(fx, context) {
		this.mOnError = context ? fx.bind(context) : fx;
		return this;
	},

	/**
	 *
	 * @param {object} data
	 * @returns {api.fx.request}
	 */
	notify: function(data) {
		this.mResult = data;
		if ("response" in this.mResult) {
			this.mOnResult && this.mOnResult(this.mResult.response);
		} else {
			this.mOnError && this.mOnError(this.mResult.error);
		}
		return this;
	},

	toString: function() {
		return "VKReq{id=" + this.getRequestId() + "; method=" + this.getMethod() + "; params=[" + JSON.stringify(this.getParams()) + "]}";
	}

};