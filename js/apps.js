var Apps = {
	RequestPage: function() {
		return Apps.getActivity();
	},

	getActivity: function(startFrom) {
		api("apps.getActivity", {
			fields: "photo_50,screen_name,online,sex",
			v: 5.18,
			count: 30,
			start_from: startFrom || "",
			platform: Site.get("platform") || "web"
		}).then(function(data) {
			if (!startFrom) {
				Apps.pageActivity();
			}
			Apps.writeActivity(data, {created: !startFrom});
		});
	},

	getTabs: function() {
		return Site.getTabPanel([ ["apps", "Активность"] ]);
	},

	pageActivity: function() {
		var page = document.createElement("div"),
			list = document.createElement("div");
		list.id = "apps-activity";

		page.appendChild(Site.getPageHeader("Активность друзей"));

		list.appendChild(Site.getEmptyField("Загрузка активности друзей.."));

		page.appendChild(list);
		Site.append(page);
	},

	apps: {},

	/**
	 * Add applications to cache
	 * @param {object[]} apps
	 * @returns {object}
	 */
	addApps: function(apps) {
		apps.map(function(app) {
			Apps.apps[app.id] = app;
		});
		return Apps.apps;
	},

	/**
	 * Show page app activity
	 * @param {{count: int, profiles: object[], apps: object[], items: {user_id: int, app_id: int}[]}} data
	 * @param options
	 */
	writeActivity: function(data, options) {
		options = options || {};

		var list = $.element("apps-activity");

		if (options.created) {
			$.elements.clearChild(list);
		}

		if (!data.count) {
			list.appendChild(Site.getEmptyField("Ваши друзья не совершали никаких действий в последнее время"));
			return;
		}

		var users = Local.add(data.profiles),
			apps = Apps.addApps(data.apps),
			items = data.items;

		for (var i = 0, item; item = items[i]; ++i) {
			list.appendChild(Apps.getItemActivity(item, users[item.user_id], apps[item.app_id]));
		}
	},

	/**
	 * Item activity app
	 * @param {{level: int, type: string}} item
	 * @param {User} user
	 * @param {{id: int, title: string, icon_50: string}} application
	 * @returns {*|HTMLElement}
	 */
	getItemActivity: function(item, user, application) {
		var e = $.elements.create,
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
				}
				return e("span", {html: string.join(" ") + " "});
			};

		return e("div", {"class": "apps-activity-item", append: [
			e("a", {"class": "apps-activity-right", href: "#app" + application.id, append: e("img", {src: getURL(application.icon_50)})}),
			e("a", {"class": "apps-activity-left", href: "#" + user.screen_name, append: e("img", {src: getURL(user.photo_50)})}),
			e("div", {"class": "apps-activity-info", append: [
				e("a", {"class": "bold", href: "#" + user.screen_name, html: user.first_name + " " + user.last_name + Site.isOnline(user)}),
				getActivity(),
				e("a", {href: "#app" + application.id, html: application.title})
			]})
		]});
	},

	/**
	 *
	 * @param {{count: int, items: VKApp[], profiles: User[], groups: Group[]}} data
	 */
	display: function(data) {
		Local.add(data.profiles.concat(data.groups));
		var app = data.items[0];
		var e = $.e,
			wrap;
		wrap = e("div", {"class": "profile-info", append: [
			e("div", {"class": "profile-left", append: e("img", {src: getURL(app.icon_150)})}),
			e("div", {"class": "profile-right", append: [
				e("strong", {html: app.title.safe()}),

				app.published_date
					? e("div", {"class": "tip", html: "Опубликовано " + getDate(app.published_date, APIDOG_DATE_FORMAT_MEDIUM)})
					: null,

				app.members_count
					? e("div", {"class": "tip", html: "Установили: " + app.members_count + " " + $.textCase(app.members_count, ["человек", "человека", "человек"])})
					: null,

				e("div", {"class": "tip", html: "Тип приложения: " + (app.section || app.type)}),
				app.author_id || app.author_group
					? e("div", {"class": "tip", html: "Автор: " + getName(app.author_id ? Local.data[app.author_id] : Local.data[-app.author_group])})
					: null,
				e("div", {style: "padding: 20px 0; margin: 0 auto;", append: e("img", {src: getURL(app.banner_560), style: "display: block;"})}),
				e("a", {"class": "btn", target: "_blank", href: "\/\/vk.com\/app" + app.id, html: "Запустить (vk.com)", onclick: function (event) {
					if (confirm("Вы уверены, что хотите перейти на vk.com? Вы станете онлайн!")) {
						return true;
					}
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