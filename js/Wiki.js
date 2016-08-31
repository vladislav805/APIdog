/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Wiki={checkEvent:function(e){return ((e=(e||window.event))&&(e.type=='click'||e.type=='mousedown'||e.type=='mouseup')&&(e.which>1||e.button>1||e.ctrlKey||e.shiftKey||browser.mac&&e.metaKey))||false},switchHider:function(el){var box=el.parentNode.parentNode;if($.elements.hasClass(box,"wk_hider_box"))box.className=box.className.replace('wk_hider_box','wk_hider_box_opened');else box.className=box.className.replace('wk_hider_box_opened','wk_hider_box')},
	WIKI_STYLES: "//apidog.ru/includes/wiki.css",
	parseContent: function(text) {
		return text
			.replace(/onclick="return showVideoAjax\('-?\d+_\d+', this\);"/img, "")
			.replace(/\/images\/play_video.png/img, "\/\/vk.com\/images\/play_video.png")
			.replace(/href="(https?:\/\/)?[A-Za-z0-9\.]*(vk\.com|vkontakte\.ru|apidog\.ru)?\/?([^"]*)"/img, function (all, protocol, domain, path) {
				return "href=\"" + (/away.php/img.test(all) ? unescape(path.replace(/\/?away(\.php)?\?to=/img, "")) : "#" + path) + "\"";
			})
			.replace(/\n/mg, "<br \/>");
	},
	insertStyles: function() {
		var e = document.getElementsByTagName("link");
		for (var i = 0, l = e.length; i < l; ++i) {
			if (e[i].link === Wiki.WIKI_STYLES) {
				return;
			};
		};

		getHead().appendChild($.e("link", {rel: "stylesheet", href: Notes.WIKI_STYLES}));
	},
	initNormalize: function() {
		var videos = document.querySelectorAll(".wk_video"),
			docs = document.querySelectorAll(".wk_doc a"),
			getThumbnailVideo = function(link) {
				return link.querySelector("img");
			};
		Array.prototype.forEach.call(videos, function(node) {
			var video = {}, t = getThumbnailVideo(node), id = node.href.split("#")[1].replace(/video(-?\d+)_(\d+)/img, "$1 $2 ").split(" ");
			video.owner_id = id[0];
			video.id = id[1];
			video.title = t.title;
			video.duration = 0;
			video.photo_320 = t.style.backgroundImage.replace(/url\(([^)]+)\)/, "$1").replace(/"|'/img, "");
			node.parentNode.insertBefore(Video.getAttachment(video), node);
			$.elements.remove(node);
		});
		Array.prototype.forEach.call(docs, function(node) {
//			console.log(node, node.href.split("#")[1]);
			node.href = "\/\/vk.com\/" + node.href.split("#")[1];
		});
	}
};