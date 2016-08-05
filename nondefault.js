
var APIDOG_VKHIDE_INTERVAL = 7000, // 7 seconds
	APIDOG_VKHIDE_STATE_DISABLED = 0,
	APIDOG_VKHIDE_STATE_ENABLED = 1;

/**
 * VK Hide
 * @deprecated
 * Не пашет
 */
var VKHide = {
	request: function() {
		APIRequest
			.createExecute("API.account.setOffline();var u=API.users.get({fields:\"online,last_seen\"})[0];return{l:u.last_seen.time};")
			.setOnCompleteListener(function(data) {
				if (VKHide.firstRequestModal) {
					VKHide.firstRequestModal.close();
					VKHide.firstRequestModal = null;
				};

				if (data.l != originalLastSeen) {
					alert(Lang.get("vkhideWentWrong"));
					originalLastSeen = data.l;
				};
			})
			.execute();
	},

	firstRequestModal: null,

	originalLastSeen: 0,
	currentState: APIDOG_VKHIDE_STATE_DISABLED,
	timer: null,

	enable: function(button) {
		switch (VKHide.currentState) {

			case APIDOG_VKHIDE_STATE_DISABLED:
				VKHide.firstRequestModal = new Modal({
					title: Lang.get("vkhideFirstRequestTitle"),
					content: Lang.get("vkhideFirstRequestContent"),
					width: 270
				}).show();

				APIRequest
					.createExecute("return API.users.get({fields:\"last_seen\"})[0].last_seen.time;")
					.setOnCompleteListener(function(time) {
							originalLastSeen = time;
							VKHide.timer = setInterval(VKHide.request, APIDOG_VKHIDE_INTERVAL);
							VKHide.request();
					})
					.execute();
				button.value = Lang.get("vkhideButtonGoTo");
				VKHide.currentState = APIDOG_VKHIDE_STATE_ENABLED;
				break;
			case APIDOG_VKHIDE_STATE_ENABLED:
				window.open("//vk.com/");
				break;
		};

		window.addEventListener("beforeunload", VKHide.onBeforeUnload);
	},

	onBeforeUnload: function(event) {
		event.preventDefault();
		return "Вы уверены?";
	}
};

/**
 * Раздел платных услуг
 */
var Pro = {

	/**
	 * Открытие модального окна оплаты услуги
	 * @param  {int}     productId Идентификатор услуги
	 * @param  {DOMNode} button    Кнопка
	 */
	goToPay: function(productId, button) {
		var data = JSON.parse(button.getAttribute("data-product")),
			items,
			item = function(value, name, fee) {
				return $.e("label", {append: [
					$.e("input", {type: "radio", name: "type", value: value}),
					$.e("span", {html: " " + Lang.get(name) + " (" + Lang.get("proFee") + " " + fee + ")"})
				]});
			},
			getSelected = function() {
				var sel;
				items.forEach(function (i) {
					i.firstChild.checked && (sel = i.firstChild.value);
				});
				return sel;
			},
			rejected = false,
			modal = new Modal({
				title: Lang.get("proModalPaymentMethodTitle"),
				content: $.e("form", {append: items = [
					item("PC", "proPaymentMethodYM", "0.98%"),
					item("AC", "proPaymentMethodBC", "1.2%"),
					item("MC", "proPaymentMethodMobile", "?")
				]}),
				footer: [
					{
						name: "next",
						title: Lang.get("proModalPaymentMethodNext"),
						onclick: function() {
							var fee;

							if (!(fee = getSelected())) {
								return;
							};

							modal.setContent(Lang.get("proCreatingOrder"));
							createOrder(fee);
						}
					},
					{
						name: "cancel",
						title: Lang.get("cancel"),
						onclick: function () {
							rejected = true;
							this.close();
						}
					}
				]
			}).show(),
			createOrder = function(fee) {
				APIdogRequest("apidog.createOrder", {
					productId: productId,
					feeType: fee
				}, function (result) {
					if (rejected) {
						return;
					};

					var goToPay = function() {
						var e = $.e("form", {action: "https://money.yandex.ru/quickpay/confirm.xml", method: "POST", "class": "hidden"}),
							i = function (key, value) { e.appendChild($.e("input", {type: "hidden", name: key, value: value})); };

						i("receiver", "410012195338722");
						i("formcomment", data.title + " (#" + result.orderId + ")");
						i("short-dest", data.title + " (#" + result.orderId + ")");
						i("label", result.orderId.toString());
						i("quickpay-form", "donate");
						i("targets", "Покупка услуги на сайте APIdog (#" + productId + ")");
						i("sum", result.amount.toFixed(2));
						i("paymentType", fee);
						i("successURL", "https://apidog.ru/6.5/pro.php?act=done&orderId=" + result.orderId);
						getBody().appendChild(e);
						e.submit();
						modal.close();
					};

					modal
						.setContent(Lang.get("proPaymentResultFee").schema({f: result.fee.toFixed(2), d: result.amount.toFixed(2)}))
						.setButton("next", {
							name: "next",
							title: Lang.get("proModalPaymentMethodPay"),
							onclick: function () {
								goToPay();
							}
						});

				})
			};

	}

}