function extendClass(child, parent) {
	var F = function() { };
	F.prototype = parent.prototype;
	child.prototype = new F();
	child.prototype.constructor = child;
	child.superclass = parent.prototype;
};

var ModuleManager = {

	data: {},

	extensionType: {
		none: "Unknown",
		js: "Script",
		css: "StyleSheet",
		png: "Image",
		jpg: "Image",
		gif: "Image",
		json: "Unknown"
	},

	isModuleLoaded: function() {
		var files = [];
		var add = function(item) {
			if (typeof item === "string" && !~item.indexOf(".") && Modules[item]) {
				item = Modules[item];
			};
			if (!item || !item.files) {
				return;
			};

			item.files && item.files.forEach(function(item) {
				if (~files.indexOf(item)) {
					return;
				};

				files.push(item);
			});
			item.dependency && (!Array.isArray(item.dependency) ? [item.dependency] : item.dependency).forEach(add);
		};
		Array.prototype.forEach.call(arguments, add);
		var ok = true;
		files.forEach(function(item) {
			item = item.substring(item.lastIndexOf("/") + 1);
			console.log(item, ModuleManager.data[item]);
			!ModuleManager.data[item] && (ok = false);
		});

		return ok;
	},

	_parse: function(file) {
		var filename, extension, item;

		filename = file.substring(file.lastIndexOf("/") + 1);

		if (ModuleManager.data[filename]) {
			return ModuleManager.data[filename];
		};

		extension = filename.substring(filename.lastIndexOf(".") + 1);
		extension = ModuleManager.extensionType[extension] ? extension : "none";

		item = new ModuleManager[ModuleManager.extensionType[extension]](file);

		ModuleManager.data[filename] = item;

		return item;
	},

	load: function(input, cb) {
		var stat = {loaded: 0}, files = [];

		if (!Array.isArray(input)) {
			input = [input];
		};

		var add = function(item) {
console.log("ModuleManager<>: adding to queue ", item);
			if (typeof item === "string" && !~item.indexOf(".") && Modules[item]) {
				item = Modules[item];
			} else if (!item || !item.files) {
				return;
			};


			item.files.forEach(function(item) {
				if (~files.indexOf(item)) {
					return;
				};

				files.push(item);
			});
item.files.length && mlog("added to queue loader modules: " + item.files.join(", "));
			item.dependency && (!Array.isArray(item.dependency) ? [item.dependency] : item.dependency).forEach(add);
		}, loadend = function(name, isCached) {
console.log("ModuleManager<>: ", (isCached ? "get from cache" : "loaded"), " ", name, " (", stat.loaded+1, " of ", files.length, ")");
!isCached && mlog("loaded module " + name + "; " + (stat.loaded+1) + "/" + files.length);
			if (++stat.loaded == files.length) {
				console.log("ModuleManager<>: done, callback");
				cb && cb();
			};
		};

		input.forEach(add);
console.log("ModuleManager<>: queue files ", files);
		files
			.map(function(file) {
				return ModuleManager._parse(file);
			})
			.filter(function(item, index, array) {
				return !(item instanceof ModuleManager.Unknown);
			})
			.forEach(function(item) {
				item._loaded
					? loadend(item._name)
					: item.load(loadend);
			});
	},

	eventManager: {
		data: {},

		has: function(name) {
			return !!ModuleManager.eventManager.data[name];
		},

		addEventListener: function(name, callback) {
			ModuleManager.eventManager.data[name] = callback;
			return this;
		},

		fire: function(name) {
			ModuleManager.eventManager.has(name) && ModuleManager.eventManager.data[name]();
			ModuleManager.eventManager.data[name] = null;
		}
	},

	File: function(url) {
		this._loaded = false;
		this._name = url.substring(url.lastIndexOf("/") + 1);
	},

	Script: function(url) {
		ModuleManager.File.apply(this, arguments);
		var e = document.createElement("script"), self = this;
		e.src = url;
		e.type = "text/javascript";
		var moduleName = this._name.substring(0, this._name.lastIndexOf("."));
		e.addEventListener("load", function(event) {
			ModuleManager.File.prototype._onload.apply(self, arguments);
			ModuleManager.eventManager.fire(moduleName);
		});
		this._url = url;
		this._source = e;
	},

	StyleSheet: function(url) {
		ModuleManager.File.apply(this, arguments);
		var e = document.createElement("link"), self = this;
		this._source = e;
		this._url = url;
		e.href = url;
		e.type = "text/css";
		e.rel = "stylesheet";
		e.addEventListener("load", function(event) {
			ModuleManager.File.prototype._onload.apply(self, arguments);
		});
	},

	Image: function(url) {
		ModuleManager.File.apply(this, arguments);
		var e = new Image(), self = this;
		this._source = e;
		this._url = url;
		e.style.position = "absolute";
		e.style.left = "-9999px";
		e.addEventListener("load", function(event) {
			ModuleManager.File.prototype._onload.apply(self, arguments);
		});
	},

	Unknown: function(url) {
		console.error("Unknown module file");
	}

};

ModuleManager.File.prototype.load = function(callback) {
	this._onloadcallback = callback;
};

ModuleManager.File.prototype._onload = function() {
	this._loaded = true;
	this._onloadcallback && this._onloadcallback(this._name);
console.log("ModuleManager<>: end load " + this._url);
};

ModuleManager.Script.prototype.load = function(callback) {
	ModuleManager.File.prototype.load.apply(this, arguments);
	document.getElementsByTagName("head")[0].appendChild(this._source);
};

ModuleManager.StyleSheet.prototype.load = function(callback) {
	ModuleManager.File.prototype.load.apply(this, arguments);
	document.getElementsByTagName("head")[0].appendChild(this._source);
};

ModuleManager.Image.prototype.load = function(callback) {
	ModuleManager.File.prototype.load.apply(this, arguments);
	this._source.src = this._url;
};


var mlogt;
function mlog(t){
	document.getElementById("module-log").innerHTML = (document.getElementById("module-log").innerHTML + "\n" + t).replace(/^\n/, "");
	mlogt && clearTimeout(mlogt);
	mlogt = setTimeout(function() { document.getElementById("module-log").innerHTML = ""; }, 3000);
}







var Modules = {
	/* Service */
	"sdk": { files: ["lib/lib1.3.0.js", "lib/sugar.min.js", "js/Constants.js", "js/SDK.js", "js/Site.js", "lib/VisibilityJSAPI.min.js", "css/base.css", "css/ui-elements.css"] },
	"lang": { files: ["js/Lang.js"] },
	"longpoll": { files: ["js/LongPoll.js"] },
	"uploader": { files: ["js/VKUpload.js"] },

	/* Pages */
	"profiles": { files: ["js/Profile.js", "css/profiles.css"], dependency: ["wall"] },
	"groups": { files: ["js/Groups.js", "css/groups.css"], dependency: ["wall"] }, // styles in friends ????
	"apps": { files: ["js/Apps.js", "css/apps.css"] },

	/* Media */
	"photos": { files: ["js/Photos.js", "css/fallback.photos.css"], dependency: ["likes", "comments"] },
	"audio": { files: ["js/Audios.js", "css/audio.css"] },
	"video": { files: ["js/Video.js", "css/fallback.video.css"], dependency: ["likes"] },
	"videojs": { files: ["/includes/videojs.js", "/includes/videojs.css", "comments"]},
	"documents": { files: ["js/Docs.js", "css/documents.css"] },
	"snapster": { files: ["js/Snapster.js"], dependency: "photos" },

	/* Wall/feed */
	"wall": { files: ["js/Wall.js", "css/fallback.wall.css", "css/wall.css", "css/fallback.comments.css"], dependency: ["likes", "media", "comments", "attacher"] },
	"feed": { files: ["js/Feed.js", "css/fallback.feed.css"], dependency: ["wall"] },
	"likes": { files: [] },
	"notifications": { files: ["js/Notifications.js", "css/fallback.notifications.css"] },
	"media": { files: ["css/fallback.attachments.css"], dependency: ["photos", "video", "audio", "documents", "attachments", "notes", "polls", "templates"] },
	"comments": { files: ["js/Comments.js", "css/comments.css"], dependency: ["attacher"] },
	"attacher": { files: ["css/attacher.css"] },

	"fave": { files: ["js/Fave.js"], dependency: ["templates"] },

	/* Comunicate */
	"mail": { files: ["js/Mail.js", "css/fallback.dialogs.css"] },
	"im": { files: ["js/IM.js", "css/dialogs.css"], dependency: ["templates", "media", "attacher"] },

	"friends": { files: ["js/Friends.js", "css/fallback.friends.css"] },
	"settings": { files: ["js/Settings.js", "css/settings.css"], dependency: ["templates"] },

	"board": { files: ["js/Board.js", "css/board.css"] },
	"attachments": { files: ["js/AttachmentsOld.js"] },
	"vkutils": { files: ["js/Dev.js"] },
	"extension": { files: ["js/Extension.js"] },
	"gifts": { files: ["js/Gifts.js"] },
	"notes": { files: ["js/Notes.js", "css/board.css", "css/notes.css"], dependency: ["wiki"] },
	"pages": { files: ["js/Pages.js", "css/pages.css"], dependency: ["wiki"] },
	"places": { files: ["js/Places.js", "css/places.css"] },
	"polls": { files: ["js/Polls.js", "css/polls.css"] },
	"search": { files: ["js/Search.js"], dependency: ["templates"] },
	"templates": { files: ["js/Templates.js"] },
	"wiki": { files: ["js/Wiki.js"] },
	"chart": { files: ["lib/Chart.min.js"] },
	"hammer": { files: ["lib/hammer.js"] },

	"lazy-css": { files: ["css/icons.css", "css/adaptive.css", "css/fallback.base.css"] },

	"analytics": { files: ["js/OtherLazy.js"] }
};

(function(w, d) {
	w.addEventListener("load", function() {
		ModuleManager.load(["sdk", "lang", "hammer"], function() {
			Sugar.extend();
			console.info("APIdog: loaded minimal");
			init();
			ModuleManager.load(["analytics", "lazy-css"]);
		});
	});
})(window, document);