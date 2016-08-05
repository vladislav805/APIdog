/**
 * APIdog v6.5
 *
 * upd: -1
 */

function sendEvent (method, data) {
	if (window.chrome || API.extension && API.extension.versionSDK >= 1.3) {
		data.method = method;
		data.OUT = true;
		window.postMessage(data, "*");
		return;
	};
	sendEventOldExt(method, data);
};
var receivingEvents = {};
function receiveEvent (method, callback) { receivingEvents[method] = callback };
function handleExtensionEvent (event) {
	receivingEvents && receivingEvents[event.method] && receivingEvents[event.method](event);
};
receiveEvent("onAccessTokenRequire", function (event) {
	if (isEnabled(APIDOG_SETTINGS_PROXY) || !isEnabled(APIDOG_SETTINGS_LONGPOLL) || window.APIdogNoInitPage) {
		return;
	};

	LongPoll._ext = true;
	LongPoll.enabled = false;
	LongPoll.Start = function () {};
	LongPoll.Abort();

	onExtensionInited(event && event.version || 1.2, event && event.agent);
	sendEvent(event.callback, {
		useraccesstoken: API.access_token,
		userAgent: "VKAndroidApp/4.38-816 (Android 6.0; SDK 23; x86;  Google Nexus 5X; ru)",
		settings: API.settings
	})
});

receiveEvent("onLongPollDataReceived", function (event) {
	try {
		var json = typeof event.updates === "string" ? JSON.parse(event.updates) : event.updates;
		LongPoll.getResult({updates: json}, null, true);
	} catch (e) {
		console.error("APIdogExtensionReceiveError<EmptyResponse>");
	}
});

window.addEventListener("message", function (event) {
	if (event.source != window)
		return;
	handleExtensionEvent(event.data);
});


function onExtensionInited (v) {
	API.isExtension = true;
	API.extension = {
		versionSDK: v
	};
	$.elements.remove($.element("_link_ext"));
};

var isLongPollStoppedNotifyed = false;
setInterval(function () {

	if (!LongPoll.enabled && !API.isExtension || isLongPollStoppedNotifyed) {
		return;
	};

	var l = (Date.now() / 1000) - LongPoll.lastRequest;
	if (l > 40) {
		isLongPollStoppedNotifyed = true;
		LongPoll.hasProblemNotify(l);
	};

}, 40000);



function sendEventOldExt(a,b){var c=document.createElement("apidogExtensionTransport"),i,d;c.setAttribute("method",a);for(i in b)c.setAttribute(i,b[i]);document.documentElement.appendChild(c);d=document.createEvent("Events");d.initEvent("apidogExtensionReceiverOut",!0,!1);c.dispatchEvent(d)};
document.addEventListener("apidogExtensionReceiver",function(a){a=_d(a);handleExtensionEvent(a);if(!(b=document.querySelectorAll("apidogextensiontransport")))return;Array.prototype.forEach.call(b,$.elements.remove)},!1);
function _d (a) {var b={},e=a.target.attributes,i=0,l=e.length;for(;i<l;)b[e[i].name]=e[i++].value;return b};