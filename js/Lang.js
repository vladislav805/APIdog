/**
 * APIdog v6.5
 *
 * Last update: 05/03/2016
 * Branch: release
 */

var Lang = {
	data: null,

	KEY_LOCAL_STORAGE: "_langCache",
	KEY_LOCAL_VERSION: "_langVersion",

	load: function(callback) {
		var cache;
		if (cache = $.localStorage(Lang.KEY_LOCAL_STORAGE)) {
			if (parseInt($.localStorage(Lang.KEY_LOCAL_VERSION)) > window.languageModify) {
				Lang.data = JSON.parse(cache);
console.log("Lang<>: language data was get from cache");
				return callback();
			} else {
console.log("Lang<>: language data was expired. Updating...");
			}
		};

console.log("Lang<>: update language data");
		APIdogRequest("apidog.getLanguageData", {}, function(result) {
			Lang.data = result.data;
			var date = parseInt(Date.now() / 1000);
			$.localStorage(Lang.KEY_LOCAL_STORAGE, JSON.stringify(Lang.data));
			$.localStorage(Lang.KEY_LOCAL_VERSION, date);
console.log("Lang<>: language data was loaded and cached in " + date);
			callback && callback();
		}, function() {
			console.error("FATAL: language data not loaded");
		}, function(percent) {
			Loader.main.setTitle("Loading language data... (" + parseInt(percent) + "%)");
		});
	},

	get: function(category, variable, count) {
		if (category.indexOf(".") >= 0) {
			category = category.split(".");
			variable = category[1];
			category = category[0];
		};

		var result = Lang.data[category][variable];

		if (Lang.data && Lang.data[category] && Lang.data[category][variable]) {
			result = Lang.data[category][variable];
		};

		if (count !== undefined) {
			result = $.textCase(count, result);
		};

		return result != null ? result : "%" + category + "." + variable + "%";
	}
};

function lg(id, extra) {
	var result, i = id.split(".");
	result = Lang.data[i[0]] && Lang.data[i[0]][i[1]];
	if (result && extra) {
		if (typeof extra === "number") {
			result = $.textCase(extra, result);
		} else {
			result = String(result).setLang(extra || {});
		};
	};
	return result || "%" + id + "%";
};