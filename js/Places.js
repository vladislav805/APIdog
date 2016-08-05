/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Places = {
	explain: function (url) {
		switch (url) {
			case "places":
				if (Site.Get("id")) {

				}
			break;
			case "place":
				switch (Site.Get("act")) {
					case "checkins":
						return Places.getCheckinList(Site.Get("id"));
					break;
					case "photos":
						return Places.getPhotos(Site.Get("lat"), Site.Get("long"), Site.Get("place"));
					break;
					default:
						return Places.getById(Site.Get("id"));
				}
			break;
		}
	},
	getById: function (id) {
		Site.API("execute", {
			code: 'return [API.places.getById({places:%p%,v:5})[0],API.places.getTypes()];'.replace(/%p%/img, id)
		}, function (data) {
			data = Site.isResponse(data);
			var place = data[0],
				type = (function (a,b,c,d,e){for(;++b<d;)if(a[b][e]==c)return a[b];return {}})(data[1],-1,place.type,data[1].length,"id"),
				parent = document.createElement("div"),
				coord = [place.latitude, place.longitude],
				strCoord = coord[1] + "," + coord[0],
				YandexMapsLinkSite = "\/\/maps.yandex.ru\/?ll=" + strCoord +"&z=14&l=map&pt=" + strCoord,
				YandexMapsLinkImage = "\/\/static-maps.yandex.ru\/1.x\/?ll=" + strCoord +
									  "&size=650,450&z=14&l=map&lang=ru-RU&pt=" + strCoord + ",vkbkm",
				checkins = place.checkins,
				created = place.created,
				updated = place.updated,
				title = Site.Escape(place.title),
				YandexMap = $.elements.create("div", {style: "background: url(" + YandexMapsLinkImage + ") no-repeat center center;", "class": "maps-map"}),
				linkToYandexMaps = $.elements.create("a", {href: YandexMapsLinkSite, target: "_blank"}),
				head = $.elements.create("div", {"class": "maps-head"}),
				headTop = $.elements.create("div");
			headTop.appendChild($.elements.create("div", {
				"class": "fr tip maps-rightblock",
				append: [
					$.elements.create("div", {html: "Добавлена: " + $.getDate(created)}),
					updated ? $.elements.create("div", {html: "Обновлена: " + $.getDate(updated)}) : null
				]
			}));
			headTop.appendChild($.elements.create("img", {src: type.icon, "class": "maps-lefticon"}));
			headTop.appendChild($.elements.create("strong", {html: title}));
			headTop.style.overflow = "hidden";
			headTop.style.marginBottom = "8px";
			head.appendChild(headTop);
			head.appendChild($.elements.create("div", {append: [
				$.elements.create("a", {html: "Отметились " + checkins + " " + $.TextCase(checkins, "человек,человека,человек".split(",")), href: "#place?act=checkins&id=" + id, "class": "fr maps-checkins"}),
				$.elements.create("input", {
					type: "button",
					value: "Отметиться здесь",
					onclick: function (event) {
						Site.API("places.checkin", {place_id: id});
					}
				})
			]}));
			linkToYandexMaps.appendChild(YandexMap);
			parent.appendChild(head);
			parent.appendChild(linkToYandexMaps);
			parent.appendChild($.elements.create("a", {html: "Фотографии рядом", href: "#place?act=photos&lat=" + place.latitude + "&long=" + place.longitude + "&place=" + id, "class": "button-block"}));
			Site.Append(parent);
			Site.SetHeader("Отметка на карте");
		});
	},
	getCheckinList: function (id) {
		Site.API("execute", {
			code: 'var p=API.places.getCheckins({place:%p%,v:5});return [API.places.getById({places:%p%})[0],p,API.users.get({user_ids: p.items@.uid,fields:\"photo_rec,online\"})];'.replace(/%p%/img, id)
		}, function (data) {
			data = Site.isResponse(data);
			var place = data[0],
				title = Site.Escape(place.title),
				place_id = id,
				checkins = data[1],
				count = checkins.count,
				items = checkins.items,
				users = Local.AddUsers(data[2]),
				parent = document.createElement("div"),
				list = document.createElement("div");
			parent.appendChild(Site.CreateHeader("Здесь " + $.TextCase(count, "отметился,отметилось,отметились".split(",")) + " " + count + " " + $.TextCase(count, "человек,человека,человек".split(","))));
			for (var i = 0, l = items.length; i < l; ++i) {
				var c = items[i],
					user = users[c.uid],
					name = user.first_name + " " + user.last_name + Site.isOnline(user),
					screen_name = user.screen_name,
					photo = getURL(user.photo_rec),
					date = $.getDate(c.date),
					text = c.text,
					post = c.id;
				list.appendChild($.e("div", {"class": "friends-item maps-checkins-item", append: [
					$.e("img", {"class": "friends-left", src: photo}),
					$.e("div", {"class": "friends-right", append: [
						$.e("a", {href: "#" + screen_name, html: "<strong>%n%</strong>".replace(/%n%/img, name)}),
						$.e("div", {
							html: "<a href='#wall%l%' class='tip'>%d%<\/a> %s%"
									.replace(/%d%/img, date + (text ? ":" : ""))
									.replace(/%s%/img, text || "")
									.replace(/%l%/img, post)
						})
					]})
				]}));
			}
			parent.appendChild(list);
			Site.Append(parent);
			Site.SetHeader("Список отметившихся");
		})
	},
	getPhotos: function (lat, lng, place) {
		Site.Loader();
		Site.APIv5("photos.search", {
			lat: lat,
			"long": lng,
			sort: 1,
			count: 40,
			offset: Site.Get("offset"),
			radius: 1750,
			v: 5.0
		}, function (data) {
			data = Site.isResponse(data);
			var count = data.count,
				photos = data.items,
				parent = document.createElement("div"),
				list = document.createElement("div");
			parent.appendChild(Site.CreateHeader(count + " " + Lang.get("photos", "photos_count", count)));
			if (count == 0)
				list.appendChild(Site.EmptyField(Lang.get("photos", "photos_empty")));
			for (var i = 0, l = photos.length; i < l; ++i) {
				if (photos[i] == null)
					break;
				list.appendChild(Photos.itemPhoto(photos[i], {likes: true, comments: false}));
			}
			parent.appendChild(list);
			parent.appendChild(Site.PagebarV2(Site.Get("offset"), count, 40));
			Site.Append(parent);
			Site.SetHeader("Фотографии рядом", {link: "place?id=" + place});
		})
	}
};