/**
 * APIdog v6.5
 *
 * Last update: 08/08/2016
 * Branch: release
 */

var _initqueue = [];

function onInited (fx) {
	fx && _initqueue.push(fx) || (function(a,b,c){for (b=-1,c=a.length;++b<c;){a[b]()}})(_initqueue);
};



var Apps = {
	RequestPage: function() {
		switch (getAct()) {
			default:
				return Apps.getActivity();
		};
	},

	getActivity: function(startFrom) {
		Site.APIv5("apps.getActivity", {
			fields: "photo_50,screen_name,online,sex",
			v: 5.18,
			count: 30,
			start_from: startFrom || "",
			platform: Site.Get("platform") || "web"
		},
		function(data) {
			!startFrom ? Apps.pageActivity() : Apps.writeActivity(Site.isResponse(data), {created: !startFrom});
		});
	},

	pageActivity: function() {
		var e = $.e,
			page = e("div"),
			list = e("div", {id: "apps-activity"});

		page.appendChild(Site.getPageHeader("Активность друзей"));
		list.appendChild(Site.EmptyField("Загрузка активности друзей.."));

		page.appendChild(list);
		Site.append(page);
	},

	apps: {},

	addApps: function(apps) {
		for (var app in apps) {
			app = apps[app];
			Apps.apps[app.id] = app;
		};

		return Apps.apps;
	},

	writeActivity: function(data, options) {
		options = options || {};

		var list = $.element("apps-activity");

		if (options.created) {
			$.elements.clearChild(list);
		};

		if (!data.count) {
			list.appendChild(Site.EmptyField("Ваши друзья не совершали никаких действий в последнее время"));
			return;
		};

		var users = Local.add(data.profiles),
			apps = Apps.addApps(data.apps),
			items = data.items;

		items.forEach(function(i) {
			list.appendChild(Apps.getItemActivity(i, users[i.user_id], apps[i.app_id]));
		});
	},

	getItemActivity: function(item, user, application) {
		var e = $.e,
			getActivity = function() {
				var string = [];
				switch (item.type) {
					case "install":
						string.push(["установило", "установила", "установил"][user.sex]);
						string.push({game: "игру", app: "приложение", standalone: "приложение", site: "приложение"}[user.type]);
						break;

					case "level":
						string.push(["достигло", "достигла", "достинг"][user.sex]);
						string.push(item.level);
						string.push("уровня в игре");
						break;
				};

				return e("span", {html: string.join(" ") + " "});
			};

		return e("div", {"class": "apps-activity-item", append: [
			e("a", {"class": "apps-activity-right", href: "#app" + application.id, append: e("img", {src: application.icon_50})}),
			e("a", {"class": "apps-activity-left", href: "#" + user.screen_name, append: [e("img", {src: getURL(user.photo_50)})]}),
			e("div", {"class": "apps-activity-info", append: [
				e("a", {"class": "bold", href: "#" + user.screen_name, html: user.first_name + " " + user.last_name + Site.isOnline(user)}),
				getActivity(),
				e("a", {href: "#app" + application.id, html: application.title})
			]})
		]});
	},

	display: function(app) {
		var e = $.e, wrap;
		wrap = e("div", {"class": "profile-info", append: [
			e("div", {"class": "profile-left", append: e("img", {src: getURL(app.icon_50)})}),
			e("div", {"class": "profile-right", append: [
				e("strong", {html: Site.Escape(app.title)}),
				app.published_date ? e("div", {"class": "tip", html: "Опубликовано " + $.getDate(app.published_date)}) : null,
				app.members_count ? e("div", {"class": "tip", html: "Установили: " + app.members_count + " " + $.textCase(app.members_count, ["человек", "человека", "человек"])}) : null,
				e("div", {"class": "tip", html: "Тип приложения: " + app.section}),
				e("div", {style: "padding: 20px 0; margin: 0 auto;", append: e("img", {src: getURL(app.banner_186), style: "display: block;"})}),
				e("a", {"class": "btn", target: "_blank", href: "\/\/vk.com\/app" + app.id, html: "Запустить (vk.com)", onclick: function (event) {
					if (confirm("Вы уверены, что хотите перейти на vk.com? Вы станете онлайн!"))
						return true;
					event.preventDefault();
					return false;
				}})
			]})
		]});
		Site.setHeader("Приложение");
		Site.append(e("div", {append: [
			Site.getPageHeader("Приложение"),
			wrap
		]}));
	}
};