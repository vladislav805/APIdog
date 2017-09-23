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
			p.v = 4.99;
		}

		p.lang = 0; // todo: send real language
		p.https = 1;
		p.access_token = API.accessToken;

		var url = httpBuildQuery(p);

		if (API.extension && API.extension.versionSDK >= 1.3) {
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
		if (typeof window.fetch === "function") {
			// TODO III
		} else {
			var xhr = new XMLHttpRequest(url);
			xhr.open("POST", url);
			xhr.send(om.getParams());
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