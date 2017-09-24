
var Lang = {
	data: null,

	KEY_LOCAL_STORAGE: "_langCache",
	KEY_LOCAL_VERSION: "_langVersion",

	/**
	 * Load language pack from server on starting application
	 * @param {function=} callback
	 * @returns {*}
	 */
	load: function(callback) {
		var cache;
		if (cache = $.localStorage(Lang.KEY_LOCAL_STORAGE)) {
			if (parseInt($.localStorage(Lang.KEY_LOCAL_VERSION)) > window.languageModify) {
				Lang.data = JSON.parse(cache);
				console.log("Lang: language data was get from cache");
				return callback();
			} else {
				console.log("Lang: language data was expired. Updating...");
			}
		}

		fetch("./lang/" + API.language + ".json").then(function(result) {
			Lang.data = result.json();
			var date = parseInt(Date.now() / 1000);
			$.localStorage(Lang.KEY_LOCAL_STORAGE, JSON.stringify(Lang.data));
			$.localStorage(Lang.KEY_LOCAL_VERSION, date);
			console.log("Lang<>: language data was loaded and cached in " + new Date(1000 * date).short());
			callback && callback();
		}).catch(function(e) {
			console.error("FATAL: language data not loaded", e);
		});
	},

	get: function(category, variable, count) {
		var id, result;

		switch (arguments.length) {
			case 3:
				id = category + "." + variable;
				break;

			case 2:
				if (typeof variable === "string") {
					id = category + "." + variable;
				} else {
					id = category;
					count = variable;
				}
				break;

			default:
				id = category;
		}

		result = Lang.data[id];

		if (result && count !== undefined) {
			result = $.textCase(count, result);
		}

		return result !== undefined ? result : "%" + id + "%";
	}
};
