var Search = {
	Requested: false,
	DATA: {},
	RequestPage: function (opts) {
		if ($.element("search-form") || ($.element("search-form") && Site.Get("q") && Search.Requested == 0))
			return Search.Search();
		var Elem = document.createElement("div"),
			Form = Site.createInlineForm({
				name: "q",
				value: Site.Get("q"),
				onkeyup: Search.getHints,
				onblur: Search.hideHints,
				onsubmit: Search.Find,
				title: "Поиск"
			}),
			List = document.createElement("div");
		Form.querySelector(".s-text").appendChild($.e("div", {"class": "search-hints-wrap", id: "search-hints-wrap"}));
		Form.appendChild(Site.createHider(
			$.e("div",{"class":"hider-title a",append:[$.elements.create("span",{html:"Дополнительные параметры"})]}),
			$.e("div",{"class":"sf-wrap",append: Search.getSearchForm()})
		));
		Form.id = "_search_form";
		List.id = "search-polygon";
		Elem.id = "search-form";
		Elem.appendChild(Site.getPageHeader("Поиск" + (Site.Get("group_id") ? " по группе" : ""), "<span class='i' id='search-count'></span>"));
		Elem.appendChild(Form);
		Elem.appendChild(List);
		Site.append(Elem);
		Site.setHeader("Поиск" + (Site.Get("group_id") ? " по группе" : ""));
		Search.Search();
		Search.RequestDataForSearch(1);
	},
	lastHint: 0,
	timer: null,
	chatedHints: {},
	getHints: function (event) {
		var e = this,
			q = $.trim(e.value);
		if (!Search.chatedHints[q]) {
			var n = parseInt(+new Date() / 1000);
			if (Search.lastHint + 0.2 >= n) {
				Search.timer = setTimeout(function () {
					Search.checkFreshHintsValue(q, e);
				}, 500);
				return;
			}
			Site.API("search.getHints", {q: q, limit: 8}, function (d) {Search.parseHints(d, q, n)});
		} else
			Search.parseHints({response: Search.chatedHints[q]}, q);
	},
	checkFreshHintsValue: function (q, i) {
		if (q == i.value)
			return;
		if (!i.q)
			i.q = Search.getHints;
		i.q();
	},
	parseHints: function (d, q, n) {
		if (d && !(d = Site.isResponse(d)))
			return;
		Search.chatedHints[q] = d;
		var e = $.e,
			w = $.element("search-hints-wrap"),
			b = e("div", {"class": "search-hints-box"}),
			t,
			f = function (o) {
				return o.profile && o.profile.first_name + " " + o.profile.last_name || o.group && o.group.name;
			},
			l = function (o) {
				return o.profile && ("id" + o.profile.uid) || o.group && o.group.screen_name;
			},
			i = function (o) {
				return e("div", {"class": "search-hints-item a", onclick: Search.onHint, "data-url": l(o), html: f(o)});
			},
			k = 0;
		while (d[k]) {
			b.appendChild(i(d[k]));
			k++;
		}
		$.elements.clearChild(w);
		w.appendChild(b);
		Search.lastHint = n;
	},
	hideHints: function () {
		setTimeout(function () {
			$.elements.clearChild($.element("search-hints-wrap"));
		}, 600);
	},
	onHint: function () {
		window.location.hash = "#" + this.getAttribute("data-url");
	},
	Find: function (event) {
		var elements = (this ? this.elements : $.element("_search_form").elements),
			params = [];
		for (var i = 0; i < elements.length; ++i){
			if (elements[i].type === "text" || elements[i].type === "hidden" || (elements[i].type === "checkbox" || elements[i].type === "radio") && elements[i].checked)
				params.push(elements[i].name + "=" + elements[i].value);
			else if (elements[i].tagName.toLowerCase() === "select")
				params.push(elements[i].name + "=" + elements[i].options[elements[i].selectedIndex].value);
		}
		window.location.hash = "#search?" + params.join("&");
		return false;
	},
	Search: function () {
		var params = {count: 30, fields: "photo,online,screen_name,sex,can_write_private_message,verified", v: 5.8},
			fields = "q,sex,offset,status,age_from,age_to,birth_day,birth_month,birth_year,country,city,group_id,interests,religion,company".split(","),
			t;
		for (var i = 0; i < fields.length; ++i)
			if((t = Site.Get(fields[i])) != 0)
				params[fields[i]] = decodeURIComponent(t);
		Search.Requested = true;
		if (Site.Get("birthday")) {
			var d = new Date();
			params.birth_day = d.getDate();
			params.birth_month = d.getMonth() + 1;
		};
		Site.APIv5("users.search", params, Search.Listing);
	},
	Listing: function (data) {
		data = Site.isResponse(data);
		var list = $.element("search-polygon"),
			newList = document.createElement("div"), count = data.count;
		$.elements.clearChild(list);
		$.element("search-count").innerHTML = count + " " + $.textCase(count, ["человек", "человека", "человек"])
		data = data.items;
		for (var i = 0; i < data.length; ++i)
			newList.appendChild(Search.item(data[i]));
		if (count === 0)
			newList.appendChild(Site.getEmptyField("По заданным параметрам ничего не найдено"));
		newList.appendChild(Site.getSmartPagebar(getOffset(), count > 1000 ? 1000 : count, 30));
		list.appendChild(newList);
	},
	item: function (fields) {
		var item = document.createElement("a"),
			right = document.createElement("div");
		item.className = "friends-item";
		item.href = "#" + (fields.screen_name || "id" + (fields.uid || fields.id));
		item.appendChild($.elements.create("img", {
			src: getURL(fields.photo || fields.photo_rec || fields.photo_50),
			alt: "",
			"class": "friends-left"
		}));
		right.className = "friends-right";
		right.appendChild($.elements.create("a", {
			href: "#" + (fields.screen_name || "id" + (fields.uid || fields.id)),
			html: Site.Escape(fields.first_name + " " + fields.last_name) + " " + Site.isOnline(fields) + Site.isVerify(fields)
		}))
		item.appendChild(right);
		return item;
	},
	getSearchForm: function () {
		var ages = (function (a, b, c) {
				for ( ; b < c; ++b)
					a.push([b, b]);
				return a;
			})([[0, "любой", true]], 14, 95),
			data = [
				{
					"type": 2,
					"name": "sex",
					"title": "Пол:",
					"params": [
						[0, "любой", true], [1, "женский"], [2, "мужской"]
					]
				},
				{
					"type": 2,
					"name": "status",
					"title": "Семейное положение",
					"params": [
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
					"type": 2,
					"name": "age_from",
					"title": "Возраст (от):",
					"params": ages
				},
				{
					"type": 2,
					"name": "age_to",
					"title": "Возраст (до):",
					"params": ages
				},
				{
					"type": 2,
					"name": "birth_day",
					"title": "День рождения:",
					"params": (function (a, b, c) {
						for ( ; b < c; ++b)
							a.push([b, b]);
						return a;
					})([[0, "день"]], 1, 32),
					"nofull": true
				},
				{
					"type": 2,
					"name": "birth_month",
					"params": (function (a, b, c) {
						for ( ; b < c.length; ++b)
							a.push([b + 1, c[b]]);
						return a;
					})([[0, "месяц"]], 0, "января,февраля,марта,апреля,мая,июня,июля,августа,сентября,октября,ноября,декабря".split(",")),
					"nofull": true,
					"onchange": function (event) {
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
					"type": 2,
					"name": "birth_year",
					"params": (function (a, b, c) {
						for ( ; b > c; --b)
							a.push([b, b]);
						return a;
					})([[0, "год"]], 2014, 1900),
					"nofull": true,
					"onchange": function (event) {
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
					"type": 1,
					"name": "has_photo",
					"title": "с фотографией"
				},
				{
					"type": 1,
					"name": "online",
					"title": "сейчас на сайте"
				},
				{
					"type": 3,
					"name": "country",
					"title": "Страна",
					"disabled": true,
					"items": [
						{
							"title": "Загрузка...",
							"value": "0"
						}
					]
				},
				{
					"type": 3,
					"name": "city",
					"title": "Город",
					"disabled": true,
					"items": [
						{
							"title": "Сначала выберите страну",
							"value": "0"
						}
					]
				},
				{
					"type": 5,
					"name": "interests",
					"title": "Интересы"
				},
				{
					"type": 5,
					"name": "religion",
					"title": "Религиозные взгляды"
				},
				{
					"type": 5,
					"name": "company",
					"title": "Компания"
				},
				{
					"type": 4,
					"name": "group_id",
					"value": Site.Get("group_id") || ""
				}
			],
			fields = document.createElement("div");
		for (var i = 0; i < data.length; ++i) {
			var c = data[i], current = Site.Get(c.name);
			switch (c.type){
				case 2:
					var ce = document.createElement("select");
					ce.name = c.name;
					for (var j = 0; j < c.params.length; ++j) {
						var k = {value: c.params[j][0], html: c.params[j][1]};
						if (current == c.params[j][0])
							k.selected = true
						ce.appendChild($.elements.create("option", k));
					}
					var currentValue;
					if ((currentValue = Site.Get(c.name)) != 0 && ce.options.length >= currentValue)
						ce.options[currentValue].selected = true;
					if (c.title)
						fields.appendChild($.e("div", {html: c.title, "class": "tip tip-form"}));
					if (c.onchange)
						$.event.add(ce, "change", c.onchange);
					if (c.nofull) {
						ce.style.width = "auto";
						ce.style.display = "inline-block";
						ce.style.marginRight = "3px";
					}
					break;
				case 1:
					var ce = document.createElement("label"),
						checkbox = $.e("input", {type: "checkbox", name: c.name, value: 1});
					if ((currentValue = Site.Get(c.name)) != 0)
						checkbox.checked = true;
					ce.appendChild(checkbox);
					ce.appendChild($.e("span", {html: c.title}));
					break;
				case 3:
					var ce = document.createElement("label"),
						select = document.createElement("select");
					select.name = c.name;
					select.id = "_search_field_" + c.name;
					if (c.disabled)
						select.disabled = true;
					if (c.items)
						for (var a = 0, b = c.items.length; a < b; ++a)
							select.appendChild($.e("option", {html: c.items[a].title, value: c.items[a].value}));
					if (c.title)
						fields.appendChild($.e("div", {html: c.title, "class": "tip tip-form"}));
					ce.appendChild(select);
					break;
				case 4:
					var ce = $.elements.create("input", {type: "hidden", name: c.name, value: c.value});
					break;
				case 5:
					var ce = $.e("label"),
						field = $.e("input", {type: "text", name: c.name, value: Site.Get(c.name) || ""});
					fields.appendChild($.e("div", {html: c.title, "class": "tip tip-form"}));
					ce.appendChild(field);
					break;
			};
			fields.appendChild(ce);
		};
		return fields;
	},
	RequestDataForSearch: function (type, value) {
		switch (type) {
			case 1:
				Site.API("database.getCountries", {need_all: 0, count: 150}, function (data) {
					data = Site.isResponse(data);
					var select = $.element("_search_field_country");
					$.elements.clearChild(select);
					data[-1] = {cid: 0, title: "Не выбрано"};
					for (var i = -1, l = data.length; i < l; ++i) {
						select.appendChild($.elements.create("option", {html: data[i].title, value: data[i].cid}))
					}
					select.disabled = false;
					select.onchange = Search.onChangeItemCountries;
				});
				break;
			case 2:
				Site.API("database.getCities", {country_id: value, count: 150}, function (data) {
					data = Site.isResponse(data);
					var select = $.element("_search_field_city");
					$.elements.clearChild(select);
					data[-1] = {cid: 0, title: "Не выбрано"};
					for (var i = -1, l = data.length; i < l; ++i) {
						select.appendChild($.elements.create("option", {html: data[i].title, value: data[i].cid}))
					}
					select.disabled = false;
					select.onchange = Search.onChangeItemCities;
				});
				break;
			default:
		}
	},
	InitSearch: function () {
		$.element("_search_form").onsubmit();
	},
	onChangeItemCountries: function (event) {
		var item = this.options[this.selectedIndex].value;
		Search.RequestDataForSearch(2, item);
		Search.InitSearch();
	},
	onChangeItemCities: function (event) {
		var item = this.options[this.selectedIndex].value;
		Search.RequestDataForSearch(2, item);
		Search.InitSearch();
	},
	Hints:function(q,elem){
		Site.API("search.getHints",{
			q:q,
			limit:8
		},function(data){
			data=Site.isResponse(data);
			var parent=document.createElement("div");
			for(var i=0;i<data.length;++i){
				var item=document.createElement("a"),
					c=data[i];
				item.className="search-hints-item";
				switch(c.type){
					case "profile":
						item.href="#id"+c.profile.uid;
						item.innerHTML='<strong>'+c.profile.first_name+' '+c.profile.last_name+'<\/strong><div class="tip">'+(Site.Escape(c.description)||"")+'<\/div>';
						break;
					case "group":
						item.innerHTML='<strong>'+c.group.name+'<\/strong><div class="tip">'+(Site.Escape(c.description)||"")+'<\/div>';
						item.href="#"+c.group.screen_name;
						break;
				}
				parent.appendChild(item);
			}
			var hint=$.element("header-search-hints");
			if(hint.children[0])
				hint.removeChild(hint.children[0]);
			hint.appendChild(parent);
		});
	},
	HintsHide:function(elem){
		setTimeout(function(){
			$.element("header-search-hints").style.display="none";
		},100);
	}
};
