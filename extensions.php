<?

	include_once "./framework.v6.5.php";
	include_once "../api-helper.php";

	function getLabel ($name) {
		$name = strPos($name, "_") === 0 ? "extensions" . UCFirst(subStr($name, 1)) : $name;
		return getLang(-1, "nonstdsite")[$name];
	};

	template(APIdogTemplateTop);
?>
<header>
					<img class="header-macbook pc" src="//static.apidog.ru/extensions/site.png" alt="APIdog" />
					<img class="header-mobile mobile" src="//static.apidog.ru/extensions/siteMobile.png" alt="APIdog" />
					<div class="header-description pc">
						<a class="header-install-button" href="https://addons.mozilla.org/ru/firefox/addon/apidog-plus/" target="_blank">
							<span><img src="//static.apidog.ru/extensions/firefox.png" alt="Firefox" />Добавить в Firefox </span>
						</a>
						<a class="header-install-button" href="https://chrome.google.com/webstore/detail/apidog-plus/ljikcihkpklkbfhnflmbcepicohfeldc" target="_blank">
							<span><img src="//static.apidog.ru/extensions/chrome.png" alt="Chrome" />Добавить в Chrome </span>
						</a>
						<a class="header-install-button" href="https://addons.opera.com/ru/extensions/details/apidog-longpoll/?display=ru-RU" target="_blank">
							<span><img src="//static.apidog.ru/extensions/opera.png" alt="Opera" />Добавить в Opera </span>
						</a>
						<a class="header-install-button" href="https://addons.opera.com/ru/extensions/details/apidog-longpoll/?display=ru-RU" target="_blank">
							<span><img src="//static.apidog.ru/extensions/yb.png" alt="Yandex.Browser" />Добавить в Яндекс.Браузер </span>
						</a>
					</div>
					<div class="header-description mobile">
						<a class="header-install-button" href="https://addons.mozilla.org/ru/firefox/addon/apidog-longpoll/" target="_blank">
							<span><img src="//static.apidog.ru/extensions/firefox.png" alt="Firefox" />Добавить в Firefox </span>
						</a>
					</div>
				</header>
				<section class="about">
					<h1 id="about">Что такое APIdog LongPoll?</h1>
					<p>Многие из вас замечали, что на сайте APIdog практически невозможно спокойно переписываться из-за постоянных глюков сервера.</p>
					<p>Именно поэтому мы создали специальное расширение, которое позволяет использовать LongPoll без участия сервера APIdog.</p>
					<p>Сообщения и события ВКонтакте будут приходить с молниеносной скоростью, точно такой же, как на vk.com!</p>
				</section>
				<section class="text">
					<h1 id="how-use">В чём преимущества?</h1>
					<ul class="cols">
						<li>
							<h2>Скорость</h2>
							<p>Все запросы к VK LongPoll отправляются от Вашего браузера &mdash; скорость обновления зависит только от загруженности Вашего интернет-соединения и скорости работы серверов ВКонтакте.</p>
						</li>
						<li>
							<h2>Безопасность</h2>
							<p>Все запросы от расширения к API ВКонтакте и серверам LongPoll отправляются по защищённому протоколу HTTPS &mdash; никакие данные перехватить невозможно.</p>
						</li>
						<li>
							<h2>Независимость</h2>
							<p>Вы всё так же будете получать сообщения в онлайн-режиме, даже если сервер APIdog упадёт.</p>
						</li>
					</ul>
				</section>
				<section class="text">
					<h1 id="how-use">Как получить?</h1>
					<ul class="cols">
						<li>
							<h2>Установка</h2>
							<p>Установи расширение для своего браузера.</p>
						</li>
						<li>
							<h2>Подготовка</h2>
							<p>Зайди на apidog.ru в раздел сообщения и&#8230;</p>
						</li>
						<li>
							<h2>Пользуйся!</h2>
							<p>Переписывайся с друзьями и близкими без задержек, находясь всё также офлайн!</p>
						</li>
					</ul>
				</section>
				<section class="text">
					<h1 id="code">А это безопасно?</h1>
					<ul class="cols">
						<li>
							<h2>Абсолютно!</h2>
							<p>Если не верите, вы можете лично посмотреть исходный код всех расширений в репозиториях на GitHub.</p>
						</li>
						<li>
							<h2>Firefox и Firefox Mobile</h2>
							<p><a href="https://github.com/vladislav805/APIdogExtensionFirefox" target="_blank">APIdogExtensionFirefox</a></p>
						</li>
						<li>
							<h2>Chrome, Opera и Я.Браузер</h2>
							<p><a href="https://github.com/vladislav805/APIdogExtensionChrome" target="_blank">APIdogExtensionChrome</a></p>
						</li>
					</ul>
				</section>
<?
	template(APIdogTemplateBottom);