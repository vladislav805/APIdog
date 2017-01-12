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
			}).show(button),
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
};