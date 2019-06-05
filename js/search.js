var Search = {

	Requested: false,
	DATA: {},

	__ID_WRAP: "search-wrap",
	__ID_FORM: "search-form",
	__ID_LIST: "search-list",
	__ID_COUNT: "search-count",
	__ID_HINTS: "search-hints-wrap",

	__COUNT_PER_REQUEST: 40,

	init: function() {
		Search.page().then(Search.request).then(Search.showList);
	},

	page: function() {
		var self = this;
		return new Promise(function(resolve) {
			var wrap = $.element(self.__ID_WRAP);
			var form = $.element(self.__ID_FORM);
			var list = $.element(self.__ID_LIST);

			var groupId = parseInt(Site.get("group_id"));

			if (!wrap && !form && !list) {
				wrap = $.e("div", {
					id: self.__ID_WRAP
				});

				var hintsWrap = $.e("div", {"class": "search-hints-wrap", id: self.__ID_HINTS});

				form = Site.createInlineForm({
					name: "q",
					value: Site.get("q"),
					onkeyup: Search.requestHints,
					onblur: Search.hideHints.bind(null, hintsWrap),
					onsubmit: Search.onSearch,
					title: "Поиск"
				});
				form.id = self.__ID_FORM;
				form.querySelector(".s-text").appendChild(hintsWrap);
				form.appendChild(Site.createHider(
					$.e("div", {
						"class": "hider-title a",
						append: $.e("span",{
							html:"Дополнительные параметры"
						})
					}),
					$.e("div", {
						"class": "sf-wrap", append: Search.getSearchForm()
					}),
					false
				));

				list = $.e("div", {id: self.__ID_LIST});

				var str = "Поиск" + (groupId > 0 ? " по группе" : "");

				wrap.appendChild(Site.getPageHeader(
					str,
					$.e("span", {"class": "i", id: self.__ID_COUNT})
				));
				wrap.appendChild(form);
				wrap.appendChild(list);

				Site.append(wrap);
				Site.setHeader("Поиск" + (groupId > 0 ? " по группе" : ""));
			}


			resolve({
				wrap: wrap,
				form: form,
				list: list,
				groupId: groupId > 0 ? groupId : false
			});
		});
	},

	onSearch: function(event) {
		event.preventDefault();
		var form = this;

		var elements = form.elements;
		var params = [];

		for (var i = 0; i < elements.length; ++i) {
			var it = elements[i];
			var value = null;
			if (it.type === "text" || it.type === "hidden" || (it.type === "checkbox" || it.type === "radio") && it.checked) {
				value = it.value;
			} else if (it.tagName.toLowerCase() === "select") {
				value = it.options[it.selectedIndex].value;
			}

			if (!!value && value !== "0") {
				params.push(it.name + "=" + value);
			}
		}

		window.location.hash = "#search?" + params.join("&");
		return false;
	},

	request: function(chain) {
		var apiParams = {
			count: Search.__COUNT_PER_REQUEST,
			fields: "photo_50,online,screen_name,sex,can_write_private_message,verified",
			v: 5.94
		};

		var params = Site.get();

		for (var key in params) {
			if (params.hasOwnProperty(key)) {
				apiParams[key] = decodeURIComponent(params[key]);
			}
		}

		if ("birthday" in params) {
			var d = new Date();
			apiParams.birth_day = d.getDate();
			apiParams.birth_month = d.getMonth() + 1;
		}

		return api("users.search", apiParams).then(function(result) {
			chain.result = result;
			return chain;
		});
	},

	showList: function(data) {
		console.log(data);

		$.elements.clearChild(data.list);

		var result = data.result;

		$.element(Search.__ID_COUNT).textContent = result.count + " " + $.textCase(result.count, ["человек", "человека", "человек"]);

		if (!result.count) {
			data.list.appendChild(Site.getEmptyField("По заданным параметрам ничего не найдено"));
		} else {
			for (var i = 0; i < result.items.length; ++i) {
				data.list.appendChild(Templates.getListItemUserRow(result.items[i]));
			}
		}
		data.list.appendChild(Site.getSmartPagebar(getOffset(), Math.min(result.count, 1000), Search.__COUNT_PER_REQUEST));
	},

	// TODO: когда-нибудь переписать этот п*здец
	getSearchForm: function () {
		var SELECT = 2, CHECKBOX = 1, HIDDEN = 4, TEXT = 5, SELECT_DYNAMIC = 3;
		var ages = (function (a, b, c) {
				for ( ; b < c; ++b)
					a.push([b, b]);
				return a;
			})([[0, "любой", true]], 14, 95),
			data = [
				{
					type: SELECT,
					name: "sex",
					title: "Пол:",
					params: [
						[0, "любой", true], [1, "женский"], [2, "мужской"]
					]
				},
				{
					type: SELECT,
					name: "status",
					title: "Семейное положение",
					params: [
						[0, "любое", true],
						[1, "не женат/не замужем"],
						[2, "встречается"],
						[3, "помолвлен(а)"],
						[4, "женат/замужем"],
						[7, "влюблен(а)"],
						[5, "все сложно"],
						[6, "в активном поиске"]
					]
				},
				{
					type: SELECT,
					name: "age_from",
					title: "Возраст (от):",
					params: ages
				},
				{
					type: SELECT,
					name: "age_to",
					title: "Возраст (до):",
					params: ages
				},
				{
					type: SELECT,
					name: "birth_day",
					title: "День рождения:",
					params: (function(a, b, c) {
						for ( ; b < c; ++b)
							a.push([b, b]);
						return a;
					})([[0, "день"]], 1, 32),
					nofull: true
				},
				{
					type: SELECT,
					name: "birth_month",
					params: (function (a, b, c) {
						for ( ; b < c.length; ++b)
							a.push([b + 1, c[b]]);
						return a;
					})([[0, "месяц"]], 0, "января,февраля,марта,апреля,мая,июня,июля,августа,сентября,октября,ноября,декабря".split(",")),
					nofull: true,
					onchange: function() {
						var selectedYear = this.form.birth_year.options[this.form.birth_year.selectedIndex].value || new Date().getFullYear(),
							isLeap = !isNaN(+new Date(selectedYear + "-02-29")),
							days = [31, (isLeap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][this.options[this.selectedIndex].value],
							nodes = this.form.birth_day;
						for (var i = 1, l = nodes.options.length; i < l; ++i)
							if (nodes.options[i + 1])
								nodes.options[i + 1].disabled = i >= days;
					}
				},
				{
					type: SELECT,
					name: "birth_year",
					params: (function (a, b, c) {
						for ( ; b > c; --b)
							a.push([b, b]);
						return a;
					})([[0, "год"]], 2014, 1900),
					nofull: true,
					onchange: function() {
						var selectedYear = this.options[this.selectedIndex].value || new Date().getFullYear(),
							isLeap = !isNaN(+new Date(selectedYear + "-02-29")),
							days = [31, (isLeap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][this.form.birth_month.options[this.form.birth_month.selectedIndex].value],
							nodes = this.form.birth_day;
						for (var i = 1, l = nodes.options.length; i < l; ++i)
							if (nodes.options[i + 1])
								nodes.options[i + 1].disabled = i >= days;
					}
				},
				{
					type: CHECKBOX,
					name: "has_photo",
					title: "с фотографией"
				},
				{
					type: CHECKBOX,
					name: "online",
					title: "сейчас на сайте"
				},
				{
					type: SELECT_DYNAMIC,
					name: "country",
					title: "Страна",
					disabled: true,
					items: [
						{
							"title": "Загрузка...",
							"value": "0"
						}
					]
				},
				{
					type: SELECT_DYNAMIC,
					name: "city",
					title: "Город",
					disabled: true,
					items: [
						{
							"title": "Сначала выберите страну",
							"value": "0"
						}
					]
				},
				{
					type: TEXT,
					name: "interests",
					title: "Интересы"
				},
				{
					type: TEXT,
					name: "religion",
					title: "Религиозные взгляды"
				},
				{
					type: TEXT,
					name: "company",
					title: "Компания"
				},
				{
					type: HIDDEN,
					name: "group_id",
					value: Site.get("group_id") || ""
				}
			],
			fields = $.e("div");

		var dynSelects = {};

		for (var i = 0; i < data.length; ++i) {
			var c = data[i];
			var current = Site.get(c.name, null);
			var ce;
			var currentValue;

			switch (c.type){
				case SELECT:
					ce = $.e("select", {
						name: c.name
					});

					for (var j = 0; j < c.params.length; ++j) {
						var k = {value: c.params[j][0], html: c.params[j][1]};

						//noinspection EqualityComparisonWithCoercionJS
						if (current == c.params[j][0]) {
							k.selected = true;
						}

						ce.appendChild($.e("option", k));
					}

					currentValue = current;
					if (!!currentValue && ce.options.length >= currentValue) {
						ce.options[currentValue].selected = true;
					}

					if (c.title) {
						fields.appendChild($.e("div", {html: c.title, "class": "tip tip-form"}));
					}

					if (c.onchange) {
						$.event.add(ce, "change", c.onchange);
					}

					// wtf?
					if (c.nofull) {
						ce.style.width = "auto";
						ce.style.display = "inline-block";
						ce.style.marginRight = "3px";
					}
					break;

				case CHECKBOX:
					ce = $.e("label");
					var checkbox = $.e("input", {type: "checkbox", name: c.name, value: 1});

					if (!!current) {
						checkbox.checked = true;
					}

					ce.appendChild(checkbox);
					ce.appendChild($.e("span", {html: c.title}));
					break;

				case SELECT_DYNAMIC:
					ce = $.e("label");
					var select = $.e("select", {
						id: "_search_field_" + c.name,
						name: c.name
					});

					if (c.disabled) {
						select.disabled = true;
					}

					if (c.items) {
						for (var a = 0, b = c.items.length; a < b; ++a) {
							select.appendChild($.e("option", {
								html: c.items[a].title,
								value: c.items[a].value
							}));
						}
					}
					if (c.title) {
						fields.appendChild($.e("div", {
							html: c.title,
							"class": "tip tip-form"
						}));
					}
					dynSelects[c.name] = select;
					ce.appendChild(select);
					break;

				case HIDDEN:
					ce = $.e("input", {type: "hidden", name: c.name, value: c.value});
					break;

				case TEXT:
					ce = $.e("label");
					var field = $.e("input", {type: "text", name: c.name, value: Site.get(c.name) || ""});
					fields.appendChild($.e("div", {html: c.title, "class": "tip tip-form"}));
					ce.appendChild(field);
					break;
			}
			fields.appendChild(ce);
		}

		Search.__initCountries(dynSelects.country);
		dynSelects.country.onchange = function() {
			Search.__initCities(dynSelects.city, parseInt(dynSelects.country.options[dynSelects.country.selectedIndex].value));
		};

		return fields;
	},

	__initCountries: function(node) {
		Search.getCountriesList().then(function(result) {
			$.elements.clearChild(node);
			var list = result.items;
			list[-1] = { id: 0, title: "Не выбрано" };
			for (var i = -1, l = list.length; i < l; ++i) {
				node.appendChild($.e("option", {html: list[i].title, value: list[i].id}));
			}
			node.disabled = false;
		});
	},

	__initCities: function(node, countryId) {
		$.elements.clearChild(node);
		console.log(countryId);
		if (!countryId) {
			node.disabled = true;
			return;
		}
		Search.getCitiesList(countryId).then(function(result) {

			var list = result.items;
			list[-1] = { id: 0, title: "Не выбрано" };
			for (var i = -1, l = list.length; i < l; ++i) {
				node.appendChild($.e("option", {html: list[i].title, value: list[i].id}));
			}
			node.disabled = false;
			//node.onchange = Search.onChangeItemCities;
		});
	},

	__lastHintRequest: 0,
	requestHints: function() {

		var now = Date.now();

		if (now - Search.__lastHintRequest < 800) {
			return;
		}

		Search.__lastHintRequest = now;


		api("search.getHints", {
			q: this.value.trim(),
			limit: 8,
			search_global: 1,
			fields: "online,screen_name",
			v: 5.94
		}).then(Search.showHints.bind(Search));
	},

	showHints: function(result) {
		var node = $.e("div", {"class": "search-hints-box"});

		node.hidden = false;

		for (var i = 0; i < result.items.length; ++i) {
			node.appendChild(Search.getItemHint(result.items[i]));
		}

		var wrap = $.element(Search.__ID_HINTS);
		$.elements.clearChild(wrap);
		wrap.appendChild(node);
	},

	/**
	 *
	 * @param {{
	 *     type: string,
	 *     profile: {id: int, first_name: string, last_name: string, online: int, screen_name: string}=,
	 *     group: {id: int, name: string, screen_name: string}=,
	 *     description: string
	 * }} hint
	 */
	getItemHint: function(hint) {
		var url = null;
		var title = null;

		switch (hint.type) {
			case "profile":
				title = hint.profile.first_name + " " + hint.profile.last_name;
				url = hint.profile.screen_name || "#id" + hint.profile.id;
				break;

			case "group":
				title = hint.group.name;
				url = hint.group.screen_name || "#club" + hint.group.id;
				break;

		}

		return $.e("div", {
			"class": "search-hints-item a",
			html: (title || "").safe(),
			onclick: function() {
				window.location.href = "#" + url;
			}
		});
	},

	hideHints: function(node) {
		setTimeout(function() {
			$.elements.clearChild(node);
			node.hidden = true;
		}, 600);
	},

	__countries: null,
	__cities: {},

	getCountriesList: function() {
		return new Promise(function(resolve) {
			if (Search.__countries) {
				resolve(Search.__countries);
				return;
			}

			return api("database.getCountries", {
				need_all: 0,
				count: 150
			}).then(function(res) {
				Search.__countries = res;
				resolve(res);
			});
		});
	},

	getCitiesList: function(countryId) {
		return new Promise(function(resolve) {
			if (Search.__cities[countryId]) {
				resolve(Search.__cities[countryId]);
				return;
			}

			return api("database.getCities", {
				country_id: countryId,
				count: 150
			}).then(function(res) {
				Search.__cities[countryId] = res;
				resolve(res);
			});
		});
	}
};
