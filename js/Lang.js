/**
 * APIdog v6.5
 *
 * Last update: 05/03/2016
 * Branch: release
 */

var Lang = {
	data: null,

	load: function (callback) {
		APIdogRequest("apidog.getLanguageData", {}, function (result) {
			Lang.data = result.data;
			callback && callback();
		});
	},

	get: function (category, variable, count) {
		if (!Lang.data) {
			return Lang.load();
		};
		if (category.indexOf(".") >= 0) {
			category = category.split(".");
			variable = category[1];
			category = category[0];
		}
		var result = Lang.data[category][variable];
		if (Lang.data && Lang.data[category] && Lang.data[category][variable])
			result = Lang.data[category][variable];
		if (count !== undefined)
			result = $.textCase(count, result);
		return result != null ? result : "%" + category + "." + variable + "%";
	}
};