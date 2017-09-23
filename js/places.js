//noinspection SpellCheckingInspection
/**
 * @type {{checkins: int, id: int, latitude: float, longitude: float, title: string, created: int, updated: int, type: string}}
 */
var Place = {};

var Places = {

	/**
	 * Request and show modal with information about place
	 * @param {int} id
	 * @param {HTMLElement} node
	 */
	showPlaceInfo: function(id, node) {
		var modal = new Modal({
			title: "Место",
			content: Site.Loader(true),
			footer: [{name: "close", title: "Закрыть", onclick: function() { this.close() }}],
			width: 550,
			noPadding: true
		}).show(node);

		api("execute", {
			code: 'return{p:API.places.getById({places:Args.p})[0],t:API.places.getTypes()};',
			p: id,
			v: 5.56
		}).then(function(data) {
			/** @var {Place} place */
			var place = data.p;

			var type = (function(a,b,c,d,e){for(;++b<d;)if(a[b][e]===c)return a[b];return{}})(data.t,-1,place.type,data.t.length,"id"),
				wrap = $.e("div"),
				strCoordinates = place.longitude + "," + place.latitude;


			wrap.appendChild($.e("div", {"class": "maps-head", append: [
				$.e("div", {style: "overflow: hidden; margin-bottom: 8px", append: [
					$.e("div", {
						"class": "fr tip maps-block-right",
						append: [
							$.e("div", {html: "Добавлена: " + $.getDate(place.created)}),
							place.updated
								? $.e("div", {html: "Обновлена: " + $.getDate(place.updated)})
								: null
						],

					}),
					$.e("img", {src: type.icon, "class": "maps-icon-left"}),
					$.e("strong", {html: place.title.safe()})
				]}),
				$.e("div", {append: [
					$.e("span", {html: "Отметились " + place.checkins + " " + $.textCase(place.checkins, "человек,человека,человек".split(",")), "class": "fr maps-check-ins"}),
					$.e("input", {
						type: "button",
						value: "Отметиться здесь",
						onclick: function() {
							Places.checkIn(id).then(function() {
								new Snackbar({text: "Успешно"}).show();
							});
						}
					})
				]})
			]}));

			//noinspection SpellCheckingInspection
			wrap.appendChild($.e("a", {
				"class": "maps-map",
				style: "background: url(\/\/static-maps.yandex.ru\/1.x\/?ll=" + strCoordinates + "&size=550,300&z=14&l=map&lang=ru-RU&pt=" + strCoordinates + ",vkbkm) no-repeat center center;",
				href: "\/\/maps.yandex.ru\/?ll=" + strCoordinates +"&z=14&l=map&pt=" + strCoordinates,
				target: "_blank"
			}));

			modal.setContent(wrap);
		});
	},

	/**
	 * Request for check in
	 * @param {int} id
	 * @returns {Promise}
	 */
	checkIn: function(id) {
		//noinspection SpellCheckingInspection
		return api("places.checkin", {place_id: id});
	}
};
