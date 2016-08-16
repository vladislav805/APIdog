<?

	/**
	 * Утилиты для работы с выводом страницы
	 */

	define("APIdogTemplateTop", "./template/top.php");
	define("APIdogTemplateBottom", "./template/bottom.php");

	/**
	 * Встраивает шаблон в страницу
	 * @param  String $file Путь к файлу
	 */
	function template ($file) {
		include $file;
	};

	/**
	 * Пагинация
	 * @param  int  $offset      Текущий сдвиг
	 * @param  int  $count       Количество элементов
	 * @param  int  $step        Количество на одной странице
	 * @param  int  $limitRadius Количество ссылок вокруг текущей страницы
	 * @return String            HTML-код
	 */
	function pagination ($offset, $count, $step, $limitRadius = 3) {
		$url = preg_replace("/(?|&)offset=(\d+)/i", "", $_SERVER['REQUEST_URI']);
		$concat = !(strpos($url, "?") >= 0) ? "?" : "&";

		$items = [];
		for ($i = $offset - ($step * $limitRadius), $l = $offset + ($step * $limitRadius); $i < $l; $i += $step) {
			if ($i < 0 || $i >= $count) {
				continue;
			};
			$items[] = '<a href="' . htmlspecialchars($url . $concat . 'offset=' . $i) . '"' . ($offset == $i ? " data-current" : "") . '>' . (floor($i / $step) + 1) . '</a>';
		};

		return (sizeOf($items) > 1 ? '<div class="pagination-wrap" data-links="' . sizeOf($items) .'" data-pages="' . ceil($count / $step) . '">' . join("", $items) . '</div>' : '');
	};

	/**
	 * Подготовка JSON-объекта для вывода пользователю в JS-модуле
	 * @param  APIdogUser $user Пользователь
	 * @return Object
	 */
	function prepareJavaScriptUserObject ($user) {
		$result = [];

		$settings = $user->getSettings();

		$result["userAccessToken"] = getAccessToken();
		$result["userAuthKey"] = getAuthKey();
		$result["userId"] = $user->userId;
		$result["authId"] = $user->authId;
		$result["settings"] = $settings;

		/*
		 * Если есть тема, получить её
		 */
		if ($settings->hasTheme()) {
			$result["theme"] = $settings->getTheme();
		};

		return $result;
	};

	/**
	 * Возвращает js-модуль для страниц для пользователей без авторизации
	 * @return array Объект для JSON
	 */
	function getUserDataForNonStdPages () {
		$user = getSessionByAuthKey(getAuthKey());

		if ($user) {
			$JavaScriptUserObject = prepareJavaScriptUserObject($user);
		};

		return ["usr" => $JavaScriptUserObject, "lng" => getLang(-1, "nonstdsite") ];
	};