<?

	/**
	 * Языковой функционал
	 */

	/**
	 * Возвращает языковую фразу из ланг-пака
	 * @param  int  $languageId  Идентификатор языка
	 * @param  String  $section  Название секции
	 * @return array             Языковые данные
	 */
	function getLang($languageId = 0, $section = "site") {
		$languageId = $languageId == -1
			? getLangId()
			: $languageId;

		if (!isset($GLOBALS["___lang" . $languageId])) {
			$GLOBALS["___lang" . $languageId] = json_decode(file_get_contents("lang/" . $languageId . ".json"), true);
		};

		return $GLOBALS["___lang" . $languageId][$section];
	};

	/**
	 * Возвращает языковую фразу по названию секции и фразы
	 * @param  String $section Название секции
	 * @param  String $name    Название фразы
	 * @return Mixed           Результат
	 */
	function getLangLabel($section, $name) {
		$name = strPos($name, "_") === 0 ? $section . UCFirst(subStr($name, 1)) : $name;
		$r = getLang(-1, "nonstdsite")[$name];
		return $r ? $r : "<\$lang#" . USER_LANGUAGE_ID . "@nonstdsite!" . $name . ">";
	};

	/**
	 * Возвращает короткое название языка по его идентификатору
	 * @param  int    $id  Идентификатор языка
	 * @return string      Короткое название
	 */
	function getLangNameById($id) {
		return ["ru", "en", "ua", 999 => "gop"][$id];
	};

	/**
	 * Возвращает языковую фразу по имени и префиксу страницы
	 * @param  String $name Имя языковой фразы
	 * @return Mixed        Результат
	 */
	function getLabel ($name) {
		global $pagePrefix;
		$name = strPos($name, "_") === 0 ? $pagePrefix . UCFirst(subStr($name, 1)) : $name;
		$section = getLang(-1, "nonstdsite");
		return isset($section[$name]) ? $section[$name] : "%nonstdsite." . $name . "%";
	};

	/**
	 * Получение текущего языка пользователя по пользовательским настройкам и заголовкам браузера
	 * @return int Идентификатор языка
	 */
	function getLangId () {

		if (defined("USER_LANGUAGE_ID")) {
			return USER_LANGUAGE_ID;
		};

		$ak = getAuthKey();
		$user = getSessionByAuthKey($ak);

		if ($user) {
			define("USER_LANGUAGE_ID", $langId = $user->getSettings()->languageId);
			return $langId;
		};

		$list = isSet($_SERVER["HTTP_ACCEPT_LANGUAGE"]) ? strToLower($_SERVER["HTTP_ACCEPT_LANGUAGE"]) : null;

		if ($list) {
            if (preg_match_all("/([a-z]{1,8}(?:-[a-z]{1,8})?)(?:;q=([0-9.]+))?/", $list, $list)) {
                $language = array_combine($list[1], $list[2]);
                foreach ($language as $n => $v) {
                    $language[$n] = $v ? $v : 1;
                };
                arSort($language, SORT_NUMERIC);
            };
        } else {
        	$language = [];
        };

		$langs = [
			"ru" => ["ru", "be", "ky", "mo", "et", "lv"],
			"en" => ["en", "de"],
			"ua" => ["ua"]
		];

		$languages = [];

		foreach ($langs as $lang => $alias) {
			if (is_array($alias)) {
				foreach ($alias as $aliasLang) {
					$languages[strToLower($aliasLang)] = strToLower($lang);
				};
			} else {
				$languages[strToLower($alias)] = strToLower($lang);
			};
		};

		$langId = ["ru" => 0, "en" => 1, "ua" => 2];

		foreach ($language as $l => $v) {
			$s = strTOK($l, "-");
			if (isSet($languages[$s])) {
				define("USER_LANGUAGE_ID", $langId[$languages[$s]]);
				return $langId[$languages[$s]];
			};
		};
		return 0;
	};