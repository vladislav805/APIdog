/**
 * Base function upload
 *
 * @param   {File}   file   File, which need upload
 */
function VKUpload (file) {
	this.file = file;
	var emptyCallback = function() {};
	this._onUploading = emptyCallback;
	this._onUploaded = emptyCallback;
	this._onError = emptyCallback;
}

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
	 * @return {Promise}
	 */
	getThumbnail: function() {
		return new Promise(function(resolve) {
			var reader = new FileReader();
			reader.addEventListener("load", function() {
				resolve({result: reader.result});
			});
			reader.readAsDataURL(this.file);
		});
	},

	_last: null,

	/**
	 * Method for starting uploading
	 *
	 * @param {string=} method
	 * @param {object=} params
	 * @param {object=} opts
	 * @return {VKUpload}
	 */
	upload: function(method, params, opts) {
		if (!method && this._last) {
			method = this._last.method;
			params = this._last.params;
		}

		params = params || {};
		params.access_token = API.accessToken;

		opts = opts || {};

		if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
			this.oldBrowserAction(method, params, opts.node);
			return this;
		}


		var self = this,
			file = this.file,
			xhr;

		this._last = {method: method, params: params};

		if (this.captchaId) {
			params.captcha_sid = this.captchaId;
			params.captcha_key = this.captchaKey;
			this.captchaId = null;
			this.captchaKey = null;
		}

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
				}
			};

			// When upload will start
			xhr.upload.onloadstart = sendOnProgress;

			// When part of file successfully sent
			xhr.upload.onprogress = sendOnProgress;

			// When uploading end (firefox fix)
			xhr.upload.onloadend = sendOnProgress;
		}

		// On received response
		xhr.onloadend = function() {
			var e = JSON.parse(xhr.responseText);
			self.onResponseReceived(e);
		};

		if (typeof FormData === "function") {
			var formData = new FormData();
			formData.append("file", this.file);
			xhr.send(formData);
		} else {
			var reader = new FileReader();
			reader.addEventListener("load", function() {
				var boundaryString = "uploadingFile",
					boundary = "--" + boundaryString,
					body = [];
				body.push(boundary);
				body.push("Content-Disposition: form-data; name=\"file\"; filename=\"" + encodeURIComponent(file.name) + "\"");
				body.push("Content-Type: application/octet-stream");
				body.push("");
				body.push(reader.result);
				body.push(boundary+"--");
				body = body.join("\r\n");
				xhr.setRequestHeader("Content-type", "multipart/form-data; boundary=\"" + boundaryString + "\"");
				xhr.setRequestHeader("Connection", "close");
				xhr.setRequestHeader("Content-length", String(body.length));
				if (xhr.sendAsBinary) {
					xhr.sendAsBinary(body);
				} else {
					//noinspection JSCheckFunctionSignatures
					xhr.send(body);
				}
			}, false);
			reader.readAsBinaryString(this.file);
		}
		this.xhr = xhr;
		return this;
	},

	getURL: function(method, params) {
		return "api-v3.php?method=vk.upload&target=" + encodeURIComponent(JSON.stringify({
			method: method,
			params: params
		})) + "&authKey=" + API.authKey;
	},

	onResponseReceived: function(data) {
		if (!data || data.error) {
			if (data && this._isCaptcha(data.error)) {
				this.showCaptcha(data.error);
			}
			this._onError(data && data.error || null);
		} else {
			this._onUploaded(data);
		}
	},

	oldBrowserAction: function(method, params, node) {
		node.name = "file";
		var fid = "obfbuf" + Date.now(),
			self = this,
			frame = $.e("iframe", {
				name: fid,
				id: fid,
				onload: function() {
					var frameDocument = getFrameDocument(this), data;

					if (frameDocument.location.href === "about:blank") {
						return;
					}

					data = frameDocument.getElementsByTagName("body")[0].innerHTML.replace(/^<[a-z]+>|<\/[a-z]+>$/ig, "");
					console.log(data);
					data = JSON.parse(data);
					self.onResponseReceived(data);
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
				onsubmit: function(event) {

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
	abort: function() {
		if (this.xhr) {
			this.xhr.abort();
		}
		return this;
	},

	_isCaptcha: function(error) {
		return error && error.error_code === 14 && error.captcha_sid;
	},

	/**
	 * @param {VkError} error
	 */
	showCaptcha: function(error) {
		var self = this;
		Site.showCaptchaBox({
			captchaId: error.captcha_sid,
			captchaImage: error.captcha_img,
			handler: function(text) {
				self.captchaId = error.captcha_sid;
				self.captchaKey = text;
				self.upload();
			}
		});
	}

};


if (!XMLHttpRequest.prototype.sendAsBinary) {
	XMLHttpRequest.prototype.sendAsBinary = function(data) {
		var ui8a = new Uint8Array(Array.prototype.map.call(data, function(x) {
			return x.charCodeAt(0) & 0xff;
		}));
		this.send(ui8a.buffer);
	};
}


/**
 * Modal window
 * @param   {Object}   o   Options
 */
function Modal (o) {
	o = o || {};
	var self = this;
	this.modal = $.e("div", {"class": 'modal'});
	this.title = $.e("h1", {"class": 'modal-title'});
	this.body = $.e("div", {"class": 'modal-content'});
	this.footer = $.e("div", {"class": 'modal-footer'});
	this.block = $.e("div", {"class": 'modal-block', onclick: o.unclosableByBlock ? null : function () { self.close() }});
	this.wrap = $.e("div", {"class": 'modal-wrap'});

	this.modal.appendChild(this.title);
	this.modal.appendChild(this.body);
	this.modal.appendChild(this.footer);

	this.wrap.appendChild(this.modal);
	this.wrap.appendChild(this.block);

	this._init();
	this._setOptions(o);
	this._windowStateChanged();
}
Modal.prototype = {

	/**
	 * Initialize modal window
	 * @return   {Modal}
	 */
	_init: function() {
		$.elements.addClass(this.wrap, "hidden");
		$.event.add(this.body, "scroll", this._onScroll);
		var self = this;
		$.event.add(window, "resize", function (event) {
			self._onResizeDocument(event);
		});

		return this._insert();
	},

	/**
	 * Insert modal to document
	 * @return   {Modal}
	 */
	_insert: function () {
		getBody().appendChild(this.wrap);
		return this;
	},

	/**
	 * Set options of modal
	 * @return   {Modal}
	 */
	_setOptions: function(o) {
		if (o.title) {
			this.setTitle(o.title);
		}

		if (o.content) {
			this.setContent(o.content);
		}

		if (o.footer) {
			if (Array.isArray(o.footer)) {
				this.buttons = o.footer;
				this._setupButtons();
			} else {
				if (typeof o.footer === "string") {
					this.footer.innerHTML = o.footer;
				} else {
					this.footer.append(o.footer);
				}
			}
		}

		if (o.noPadding) {
			this.setPadding(false);
		}

		if (o.width) {
			this.setWidth(o.width);
		}

		if (o.height) {
			this.setHeight(o.height);
		}

		if (o.onScroll) {
			this._onScrollCallback = o.onScroll;
		}

		return this;
	},

	/**
	 * Set padding state in content window
	 * @param {boolean} state
	 * @returns {Modal}
	 */
	setPadding: function(state) {
		$.elements[state ? "removeClass" : "addClass"](this.body, "modal-content-noPadding");
		return this;
	},

	/**
	 * Setup buttons by special format
	 * @return   {Modal}
	 */
	_setupButtons: function() {
		if (!this.buttons) {
			return this;
		}

		this.footer.innerHTML = "";
		var n = this.footer, self = this;
		this.buttons.forEach(function(item) {
			/** @var {{title: string, name: string, onclick: function}} item */
			n.appendChild($.e("button", {html: item.title, "data-name": item.name, onclick: function() {
				item.onclick.call(self);
			}}));
		});

		return this;
	},

	/**
	 * Open modal and show it on document
	 * @return   {Modal}
	 */
	show: function(fromNodeAnimation) {
		/*if (fromNodeAnimation) {

			if (~Object.prototype.toString.call(fromNodeAnimation).toLowerCase().indexOf("html")) {
				fromNodeAnimation = this.computeFrom(fromNodeAnimation);
			}

			this._showAnimate(fromNodeAnimation);
		}*/

		$.elements.removeClass(this.wrap, "hidden");

		this._onResizeDocument();
		return this;
	},

	_showAnimate: function(from) {
		var modal = this.modal,
			setStyle = function(left, top, scale, opacity) {
				modal.style.opacity = opacity;
				prefix(modal, "transform", "translate(" + left + "px, " + top + "px) scale(" + scale + ")");
			},
			doc = {height: document.documentElement.clientHeight, width: document.documentElement.clientWidth};

		$.elements.removeClass(modal, "modal-animation");
		$.elements.addClass(modal, "modal-targetAnimated");

		setStyle(
			from.left - (doc.width / 2),
			from.top - (doc.height / 2),
			.1,
			.1
		);

		setTimeout(function() {
			setStyle(0, 0, 1, 1);
		}, 50);

		setTimeout(function() {
			$.elements.removeClass(modal, "modal-targetAnimated");
		}, 320);
	},

	computeFrom: function(node) {
		var pos = $.getPosition(node);
		pos.top -= getScroll();
		return {
			top: pos.top + pos.height / 2,
			left: pos.left + pos.width / 2
		};
	},

	/**
	 * Close modal
	 */
	close: function() {
		$.elements.addClass(this.wrap, "modal-closing");
		var s = this;
		setTimeout(function () {
			s.remove();
		}, 600);
		return this;
	},

	remove: function() {
		$.elements.remove(this.wrap);
		this._windowStateChanged();
	},

	/**
	 * Set title of modal
	 * @param   {String}   title   New title of modal
	 */
	setTitle: function(title) {
		this.title.innerHTML = title;
		return this;
	},

	/**
	 * Set content of modal
	 *
	 * @param   {?}   content   New content of modal
	 */
	setContent: function(content) {
		this.body.innerHTML = "";
		if (typeof content === "string")
			this.body.innerHTML = content;
		else
			this.body.appendChild(content);
		return this;
	},

	/**
	 * Return content wrapper
	 * @return   {Node}   Wrapper of content modal
	 */
	getContent: function() {
		return this.body;
	},

	/**
	 * Set footer of modal
	 *
	 * @param   {?}   footer   New footer of modal
	 */
	setFooter: function(footer) {
		this.footer.innerHTML = "";
		if (typeof footer === "string")
			this.footer.innerHTML = footer;
		else
			this.footer.appendChild(footer);
		return this;
	},

	/**
	 * Current button-set
	 *
	 * @return   {Array}   Buttons of modal
	 */
	getButtons: function () {
		if (!this.buttons) {
			return false;
		}
		return this.buttons;
	},

	/**
	 * Adding button
	 *
	 * @param   {Object}   opts   Options of button
	 */
	addButton: function (opts) {
		this.getButtons().unshift(opts);
		this._setupButtons();
		return this;
	},

	/**
	 * Replace button in modal
	 *
	 * @param   {String}   name   Name of button
	 * @param   {Object}   opts   Options of button
	 */
	setButton: function(name, opts) {
		var found = -1;
		this.buttons = this.buttons.map(function (i) {
			if (i.name !== name)
				return i;
			found = true;
			return opts;
		});
		if (found)
			this._setupButtons();
		return this;
	},

	/**
	 * Replace button in modal
	 *
	 * @param buttons
	 */
	setButtons: function(buttons) {
		this.buttons = buttons;
		this._setupButtons();
		return this;
	},

	/**
	 * Remove button from footer
	 *
	 * @param    {String}   name   Name of button
	 * @return   {Modal}
	 */
	removeButton: function(name) {
		var index = -1;
		this.buttons = this.buttons.forEach(function (i, x) {
			if (i.name !== name)
				return;
			index = x;
		});
		if (~index) {
			this.buttons.splice(index, 1);
			this._setupButtons();
		}
		return this;
	},

	/**
	 * Set width of modal window
	 *
	 * @param   {Number}   w   New value of width
	 */
	setWidth: function(w) {
		this.modal.style.maxWidth = this._fixSize(w);
		return this;
	},

	/**
	 * Set height of modal window
	 *
	 * @param   {Number}   h   New value of height
	 */
	setHeight: function(h) {
		this.modal.style.height = this._fixSize(h);
		return this;
	},

	_fixSize: function (p) {
		return typeof p === "number" ? p + "px" : p;
	},

	closeAfter: function (time) {
		var s = this;
		setTimeout(function () { s.close(); }, time);
	},

	_onScrollCallback: null,

	_onScroll: function (event) {
		this._onScrollCallback && this._onScrollCallback({
			top: event.scrollTop,
			scrollHeight: this.body.offsetHeight,
			contentHeight: this.body.firstChild && this.body.firstChild.offsetHeight
		});
	},

	_onResizeDocument: function() {
		var d = document.documentElement.clientHeight;

		this.modal.style.maxHeight = (d - 50) + "px";
		this.body.style.maxHeight = (d - 157) + "px";

		if (this.onRecount) {
			this.modal.style.width = this.onRecount(document.documentElement.clientWidth) + "px";
		}
	},

	_windowStateChanged: function () {
		var hasOpened = false;
		Array.prototype.forEach.call(document.querySelectorAll(".modal"), function (i) {
			if (!$.elements.hasClass(i, "hidden")) hasOpened = true;
		});
		$.elements[hasOpened ? "addClass" : "removeClass"](document.documentElement, "__fixedBody");
	}
};
/**
 * Custom progressbar
 *
 * @param   {Number}   min   Minimal value
 * @param   {Number}   max   Maximum value
 */
function ProgressBar (min, max) {
	this.min = min || 0;
	this.max = max || 100;
	this.value = 0;
	this.wrap = $.e("div", {"class": 'pb-wrap', append: this.line = $.e("div", {"class": 'pb-line'})});
	this._init();
}

ProgressBar.prototype = {
	_init: function () {

	},

	/**
	 * Return node of progressbar
	 * @return   {Node}
	 */
	getNode: function () {
		this.update();
		return this.wrap;
	},

	/**
	 * Update UI by current values
	 * @return   {ProgressBar}
	 */
	update: function () {
		this.line.style.width = this.getPercent() + "%";
		return this;
	},

	/**
	 * Eval percent from current values
	 * @return   {Number}
	 */
	getPercent: function () {
		return Math.abs(this.min - ((this.min + this.value) * 100 / this.max));
	},

	/**
	 * Change minimal value
	 * @param   {Number}   min   New minimal value
	 */
	setMin: function (min) {
		this.min = min;
		this.update();
		return this;
	},

	/**
	 * Change maximal value
	 * @param   {Number}   max   New maximal value
	 */
	setMax: function (max) {
		this.max = max;
		this.update();
		return this;
	},

	/**
	 * Change current value
	 * @param   {Number}   value   New value
	 */
	setValue: function (value) {
		this.value = value;
		this.update();
		return this;
	},

	/**
	 * Return current value
	 * @return   {Number}   Current value
	 */
	getValue: function () {
		return this.value;
	}
};