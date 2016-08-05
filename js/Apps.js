/**
 * APIdog v6.5
 *
 * upd: -1
 */

var _initqueue = [];

function onInited (fx) {
	fx && _initqueue.push(fx) || (function(a,b,c){for (b=-1,c=a.length;++b<c;){a[b]()}})(_initqueue);
};



var Apps = {
	RequestPage: function ()
	{
		switch (Site.Get("act"))
		{
			/* case "requests":
				return Apps.getRequests();
			break; */
			default:
				return Apps.getActivity();
		};
	},
	getActivity: function (startFrom)
	{
		Site.APIv5("apps.getActivity",
		{
			fields: "photo_50,screen_name,online,sex",
			v: 5.18,
			count: 30,
			start_from: startFrom || "",
			platform: Site.Get("platform") || "web"
		},
		function (data)
		{
			if (!startFrom)
				Apps.pageActivity();
			Apps.writeActivity(Site.isResponse(data), {created: !startFrom});
		});
	},
	getTabs: function ()
	{
		return Site.CreateTabPanel([
			["apps", "Активность"]
		]);
	},
	pageActivity: function ()
	{
		var page = document.createElement("div"),
			list = document.createElement("div");
		list.id = "apps-activity";

		//page.appendChild(Apps.getTabs());
		page.appendChild(Site.CreateHeader("Активность друзей"));

		list.appendChild(Site.EmptyField("Загрузка активности друзей.."));

		page.appendChild(list);
		Site.Append(page);
	},
	apps: {},
	addApps: function (apps) {
		for (var app in apps) {
			app = apps[app];
			Apps.apps[app.id] = app;
		}
		return Apps.apps;
	},
	writeActivity: function (data, options)
	{
		options = options || {};

		var list = $.element("apps-activity");

		if (options.created)
			$.elements.clearChild(list);

		if (!data.count)
		{
			list.appendChild(Site.EmptyField("Ваши друзья не совершали никаких действий в последнее время"));
			return;
		};

		var users = Local.AddUsers(data.profiles),
			apps = Apps.addApps(data.apps),
			items = data.items;

		for (var i = 0, l = items.length; i < l; ++i)
		{
			list.appendChild(Apps.getItemActivity(items[i], users[items[i].user_id], apps[items[i].app_id]));
		};
	},
	getItemActivity: function (item, user, application)
	{
		var e = $.elements.create,
			getActivity = function ()
			{
				var string = [];
				switch (item.type)
				{
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
	showItem: function (app)
	{
		var e = $.e,
			wrap;
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
		Site.SetHeader("Приложение");
		Site.Append(e("div", {append: [
			Site.CreateHeader("Приложение"),
			wrap
		]}));
	}
};