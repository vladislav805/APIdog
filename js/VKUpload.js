/**
 * APIdog v6.5
 *
 * Branch: release
 *
 * Last update: 10/03/2016
 */

/**
 * Base function upload
 *
 * @param   {File}   file   File, which need upload
 */
function VKUpload (file) {
	this.file = file;
	var emptyCallback = function () {};
	this._onUploading = emptyCallback;
	this._onUploaded = emptyCallback;
	this._onError = emptyCallback;
};
VKUpload.prototype = {

	/**
	 * Change callback of onUploaded event
	 * Launching when file was successfully uploaded
	 *
	 * @param    {Function}   callback   New callback function
	 * @return   {VKUpload}
	 */
	onUploaded: function (callback) {
		this._onUploaded = callback;
		return this;
	},

	/**
	 * Change callback of onUploading event
	 * Launching when some parts of file was sent to server
	 *
	 * @param    {Function}   callback   New callback function
	 * @return   {VKUpload}
	 */
	onUploading: function (callback) {
		this._onUploading = callback;
		return this;
	},

	/**
	 * Change handler of errors
	 *
	 * @param    {Function}   callback   New handler
	 * @return   {VKUpload}
	 */
	onError: function (callback) {
		this._onError = callback;
		return this;
	},

	/**
	 * Returns extension of file by filename
	 * @return   {String}   Extension
	 */
	getExtension: function () {
		return this.file.name.substring(this.file.name.indexOf(".") + 1);
	},

	/**
	 * Return true if uploading file is image
	 * @return   {Boolean}
	 */
	isImage: function () {
		return !!~["jpg", "gif", "png"].indexOf(this.getExtension());
	},

	/**
	 * Create thumbnail of image and return it in callback
	 *
	 * @param    {Function}   callback   Function where will be return thumbnail
	 * @return   {Void}
	 */
	getThumbnail: function (callback) {
		var reader = new FileReader(), url;
		reader.addEventListener("load", function (event) {
			callback({result: reader.result});
		});
		reader.readAsDataURL(this.file);
		return this;
	},

	_last: null,

	/**
	 * Method for starting uploading
	 *
	 * @param    {String}   method   Method for receiving upload URL
	 * @param    {Object}   params   Params (if has) for recieving upload URL
	 * @return   {VKUpload}
	 */
	upload: function (method, params, opts) {
		if (!method && this._last) {
			method = this._last.method;
			params = this._last.params;
		};

		params = params || {};
		params.access_token = API.access_token;

		opts = opts || {};

		if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
			this.oldBrowserAction(method, params, opts.node);
			return false;
		};


		var self = this,
			file = this.file,
			xhr;

		this._last = {method: method, params: params};

		if (this.captchaId) {
			params.captcha_sid = this.captchaId;
			params.captcha_key = this.captchaKey;
			this.captchaId = null;
			this.captchaKey = null;
		};

		xhr = new XMLHttpRequest();
		xhr.open("POST", this.getURL(method, params), true);
		if (xhr.upload) {
			var sendOnProgress = function (event) {
				if (self._onUploading) {
					self._onUploading({
						total: event.total,
						loaded: event.loaded,
						percent: event.loaded * 100 / event.total
					});
				};
			};

			// When upload will start
			xhr.upload.onloadstart = sendOnProgress;

			// When part of file successfully sent
			xhr.upload.onprogress = sendOnProgress;

			// When uploading end (firefox fix)
			xhr.upload.onloadend = sendOnProgress;
		};

		// On received response
		xhr.onloadend = function (event) {
			var e = JSON.parse(xhr.responseText);
			self.onResponseRecieved(e);
		};

		if (typeof FormData == "function") {
			var formData = new FormData();
			formData.append(typeof this.file === "string" ? "url" : "file", this.file);
			xhr.send(formData);
		} else {
			var reader = new FileReader();
			reader.addEventListener("load", function (event) {
				var boundaryString = "uploadingfile",
					boundary = "--" + boundaryString,
					requestbody = [];
				requestbody.push(boundary);
				requestbody.push("Content-Disposition: form-data; name=\"file\"; filename=\"" + unescape(encodeURIComponent(file.name)) + "\"");
				requestbody.push("Content-Type: application/octet-stream");
				requestbody.push("");
				requestbody.push(reader.result);
				requestbody.push(boundary+"--");
				requestbody = requestbody.join("\r\n");
				xhr.setRequestHeader("Content-type", "multipart/form-data; boundary=\"" + boundaryString + "\"");
				xhr.setRequestHeader("Connection", "close");
				xhr.setRequestHeader("Content-length", requestbody.length);
				if (xhr.sendAsBinary)
					xhr.sendAsBinary(requestbody);
				else
					xhr.send(requestbody);
			}, false);
			reader.readAsBinaryString(this.file);
		};
		this.xhr = xhr;
		return false;
	},

	getURL: function (method, params) {
		return "uploader.php?target=" + encodeURIComponent(JSON.stringify({
			method: method,
			params: params
		})) + "&authKey=" + API.userAuthKey;
	},

	onResponseRecieved: function (data) {
		if (!data || data.error) {
			if (data && this._isCaptcha(data.error)) {
				return this.showCaptcha(data.error);
			};
			this._onError(data && data.error || null);
		} else {
			this._onUploaded(data);
		};
	},

	oldBrowserAction: function (method, params, node) {
		node.name = "file";
		var fid = "obfbuf" + Date.now(),
			self = this,
			frame = $.e("iframe", {
				name: fid,
				id: fid,
				onload: function () {
					var frameDocument = getFrameDocument(this), data;
					if (frameDocument.location.href == "about:blank")
						return;
					data = frameDocument.getElementsByTagName("body")[0].innerHTML.replace(/^<[a-z]+>|<\/[a-z]+>$/ig, "");
					data = $.JSON(data);
					self.onResponseRecieved(data);
					$.elements.remove(form);
				}
			}),
			form = $.e("form", {
				"class": "hidden",
				target: fid,
				append: [node, frame],
				action: this.getURL(method, params),
				method: "post",
				enctype: "multipart/form-data",
				onsubmit: function (event) {

				}
			});
		getBody().appendChild(form);
		form.submit();
		this._onUploading({ total: 1, loaded: 0, percent: 0 });
	},

	/**
	 * Abort and cancel sending file
	 * @return   {VKUpload}
	 */
	abort: function () {
		if (this.xhr)
			this.xhr.abort();
		return this;
	},

	_isCaptcha: function (error) {
		return error && error.error_code == 14 && error.captcha_sid;
	},

	showCaptcha: function (error) {
		var self = this;
		Site.showCaptchaBox({
			captchaId: error.captcha_sid,
			captchaImage: error.captcha_img,
			handler: function (text) {
				self.captchaId = error.captcha_sid;
				self.captchaKey = text;
				self.upload();
			}
		});
	}

};


if (!XMLHttpRequest.prototype.sendAsBinary) {
	XMLHttpRequest.prototype.sendAsBinary = function (datastr) {
		function byteValue (x) {
			return x.charCodeAt(0) & 0xff;
		};
		var ui8a = new Uint8Array(Array.prototype.map.call(datastr, byteValue));
		this.send(ui8a.buffer);
	};
};