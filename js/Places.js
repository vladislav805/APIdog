/**
 * APIdog v6.5
 *
 * Last update: 28/08/2016
 * Branch: release
 */

var Places = {
	explain: function(url) {
		switch (getAct()) {
			case "checkins":
				return Places.getCheckinList(Site.get("id"));

			case "photos":
				var g = Site.get();
				return Places.getPhotos(g.lat, g["long"], g.place);

			default:
				return Places.getById(Site.get("id"));
		};
	},

	getById: function(id) {
		new APIRequest("execute", {
			code: "return{p:API.places.getById({places:Args.p,v:5.52})[0],t:API.places.getTypes()};",
			p: id
		}).setOnCompleteListener(function(data) {
			var place = data.p,
				type = (function(a,b,c,d,e){
					for(;++b<d;)
						if(a[b][e]==c)
							return a[b];
					return {}
				})(data.t, -1, place.type, data.t.length, "id"),
				e = $.e,
				parent = e("div"),
				coord = [place.latitude, place.longitude],
				strCoord = coord[1] + "," + coord[0],
				YandexMapsLinkSite = "\/\/maps.yandex.ru\/?ll=" + strCoord +"&z=14&l=map&pt=" + strCoord,
				YandexMapsLinkImage = "\/\/static-maps.yandex.ru\/1.x\/?ll=" + strCoord +
									  "&size=650,450&z=14&l=map&lang=ru-RU&pt=" + strCoord + ",vkbkm",
				checkins = place.checkins,
				created = place.created,
				updated = place.updated,
				title = place.title.safe(),

				linkToYandexMaps = e("a", {
					href: YandexMapsLinkSite,
					target: "_blank",
					append: e("div", {
						style: "background: url(" + YandexMapsLinkImage + ") no-repeat center center;",
						"class": "maps-map"
					})
				}),
				head = e("div", {"class": "maps-head", append: [
					e("div", {"class": "maps-head-title", append: [
						e("div", {
							"class": "fr tip maps-rightblock",
							append: [
								e("div", {html: lg("places.labelDateAdded").schema({d: $.getDate(created)})}),
								updated ? e("div", {html: lg("places.labelDateUpdated").schema({d: $.getDate(updated)})}) : null
							]
						}),
						e("img", {src: type.icon, "class": "maps-lefticon"}),
						e("strong", {html: title})
					]}),
					e("div", {append: [
						e("span", {
							html: checkins
								? lg("places.labelCheckined").schema({n: checkins, h: lg("places.labelCheckins", checkins)})
								: lg("places.labelChecinesNot"),
							onclick: function(event) {
								Places.getCheckinList(id, this);
							},
							"class": "fr a maps-checkins"
						}),
						e("input", {
							type: "button",
							value: lg("places.doCheckin"),
							onclick: function (event) {
								Places.doCheckin(id);
							}
						})
					]})
				]});

			parent.appendChild(head);
			parent.appendChild(linkToYandexMaps);
			parent.appendChild(e("a", {html: lg("places.buttonPhotosNear"), href: "#place?act=photos&lat=" + place.latitude + "&long=" + place.longitude + "&place=" + id, "class": "button-block"}));
			Site.append(parent);
			Site.setHeader(lg("places.titlePlace"));
		}).execute();
	},

	doCheckin: function(placeId) {
		new APIRequest("places.checkin", {place_id: id}).setOnCompleteListener(function() {
// TODO
		}).execute();
	},

	getCheckinList: function(placeId, node) {
		var
			e = $.e,
			offset = 0,
			step = 100,
			allLoaded = false,
			wrap = e("div", {"class": "listView-wrap", append: getLoader()}),
			modal = new Modal({
				title: lg("profiles.modalSubscriptionsTitleLoading"),
				content: wrap,
				noPadding: true,
				footer: [{
					name: "close",
					title: lg("general.close"),
					onclick: function() { this.close() }
				}]
			}).show(node),
			load = function(callback) {
				new APIRequest("execute", {
					code: "var p=API.places.getCheckins({place:Args.p,v:5.52,count:20,offset:parseInt(Args.o)});return{p:API.places.getById({places:Args.p})[0],l:p,u:API.users.get({user_ids:p.items@.user_id,fields:Args.f})};",
					p: placeId,
					f: "photo_50,online,screen_name",
					o: offset
				}).setOnCompleteListener(function(data) {
					if (!offset) {
						$.elements.clearChild(wrap);
					};

					var place = data.p,
						list = data.l,

						count = list.count,
						list = list.items;

					Local.add(data.u);

					modal.setTitle(lg("places.modalCheckinsTitle").schema({n: count, h: lg("places.modalCheckins", count)}));

					(list || []).map(function(c) {

						user = Local.Users[c.user_id];

						wrap.appendChild(e("div", {"class": "friends-item maps-checkins-item", append: [
							e("img", {"class": "friends-left", src: getURL(user.photo_50)}),
							e("div", {"class": "friends-right", append: [
								e("a", { href: "#" + user.screen_name, append: e("strong", {html: getName(user)}) }),
								$.e("div", { append: [
									e("a", { href: "#wall" + c.id, "class": "tip", html: $.getDate(c.date) + (c.text ? ":" : "") }),
									c.text ? e("div", {html: c.text.safe()}) : null
								]})
							]})
						]}));
					});

					if (wrap.children.length >= count) {
						allLoaded = true;
					};

					offset += list.length;

					callback && callback();

				}).execute();
			};

		setSmartScrollListener(wrap.parentNode, function(reset) {
			!allLoaded && load(reset);
		});

		load();
	},

	getPhotos: function(lat, lng, place) {
		Site.Loader();
		new APIRequest("photos.search", {
			lat: lat,
			"\"long\"": lng,
			sort: 1,
			count: 40,
			offset: getOffset(),
			radius: 1750,
			v: 5.0
		}).debug().setWrapper(APIDOG_REQUEST_WRAPPER_V5).setOnCompleteListener(function(data) {
			var e = $.e,
				count = data.count,
				photos = data.items,
				parent = e("div"),
				list = e("div");
			parent.appendChild(Site.getPageHeader(lg("places.photosTitle").schema({p: lg("places.photosCount", count), n: count}) ));
			if (!count) {
				list.appendChild(getEmptyField(lg("places.photosEmpty")));
			} else {
				for (var i = 0, l = photos.length; i < l; ++i) {
					if (!photos[i]) {
						continue;
					};
					list.appendChild(Photos.itemPhoto(photos[i], {likes: true, comments: false}));
				};
			};
			parent.appendChild(list);
			parent.appendChild(Site.PagebarV2(getOffset(), count, 40));
			Site.append(parent).setHeader(lg("places.photosHeader"), {link: "place?id=" + place});
		}).execute();
	}
};