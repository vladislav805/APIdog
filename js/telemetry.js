window.addEventListener("error", function handler(msg, file, line, col, err) {
	if (handler.count > 5) {
		return;
	}

	if (msg instanceof Event) {
		err = msg.error;
		file = err.fileName;
		line = err.lineNumber;
		col = err.columnNumber;
		msg = msg.message;
	}

console.log(msg, file, line, col, err);
	var stack = err && err.stack,
		data = {
			type: (!file || /apidog\.ru/.test(file) ? "in" : "ex") + "ternal",
			message: msg,
			stack: stack
				? stack
				: (
					file
						? 'file: ' + file + ':' + line + ':' + col
						: 'nofile'
				),
			ua: navigator.userAgent,
			location: location.href
		},

		modal,
		textNote,

		showReportModal = function() {
			modal = new Modal({
				title: "Ошибка",
				content: $.e("div", {append: [
					$.e("div", {html: "Произошла ошибка в ходе исполнения скрипта. Желаете отправить репорт разработчикам? Будут отправлены только технические данные (стек вызовов, версия и название браузера и ОС), конфиденциальные данные сохраняться не будут. При желании, Вы можете описать что Вы только что делали, что привело к появлению этой ошибки."}),
					textNote = $.e("textarea", {placeholder: "Необязательный комментарий", style: "width: 100%;box-sizing: border-box;margin-top:8px;"}),
					$.e("textarea", {html: data.message+"\n"+data.stack.split("\n").map(function(item, index) { return "\t".repeat(index) + item; }).join("\n"), style: "width: 100%;box-sizing: border-box;margin-top:8px;font-size: 10px;", readonly: true})
				]}),
				footer: [
					{
						name: "yes",
						title: "Отправить",
						onclick: function() {
							send();
							this.close();
						}
					},
					{
						name: "no",
						title: "Не хочу",
						onclick: function() {
							this.close();
						}
					}
				]
			}).show();
		},

		send = function() {
			data.user = textNote.value.trim();
			var url = "./api-v3.php?method=internal.collectError&data=" + encodeURIComponent(JSON.stringify(data));

			//noinspection JSUnresolvedVariable
			if (typeof navigator.sendBeacon === "function") {
				//noinspection JSUnresolvedFunction
				navigator.sendBeacon(url, " ");
			} else {
				new Image().src = url;
			}

			if (handler.count) {
				handler.count++;
			} else {
				handler.count = 1;
			}
		};

	Site.Alert({
		text: "Произошла ошибка! Нажмите сюда чтобы увидеть подробности.",
		click: showReportModal,
		duration: 5000
	});
	return true;
});
