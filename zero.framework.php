<?

	/* ------------------------------ *
	 * APIdog.ru                      *
	 * version 6.5                    *
	 * Copyright (c) 2012-2016        *
	 * ------------------------------ *
	 * Vladislav Veluga (c) 2009-2016 *
	 * ------------------------------ *
	 * 02 marth 2016                  *
	 * ------------------------------ *
	 */

	if ($_REQUEST["act"] ?? false) {
		header("X-Frame-Options: SAMEORIGIN");
	};

	session_start();

	date_default_timezone_set("Europe/Minsk"); // GMT+3

	header("Content-Type: text/html; charset=UTF-8");

	define("KEY_ACCESS_TOKEN", "userAccessToken");
	define("KEY_AUTH_KEY", "authKey");

	define("userAccessToken", $_COOKIE[KEY_ACCESS_TOKEN] ?? false);
	define("userAuthKey", $_COOKIE[KEY_AUTH_KEY]);

	$mDatabase;

	/**
	 * Возвращает токен из кук
	 * @return String access_token
	 */
	function getAccessToken() {
		return userAccessToken ?? false;
	};

	/**
	 * Возвращает ключ авторизации от APIdog
	 * @return String authKey
	 */
	function getAuthKey() {
		return userAuthKey ?? false;
	};

	/**
	 * Подключение к БД
	 * @return [type] [description]
	 */
	function connectDatabase() {
		global $dbHost, $dbUser, $dbPassword, $dbDatabase;
		return ($GLOBALS["mDatabase"] = new mysqli($dbHost, $dbUser, $dbPassword, $dbDatabase));
	};

	/**
	 * Возвращает объект MySQLi для работы с БД
	 * @return MySQLi Дескриптор для работы с БД
	 */
	function getDatabase() {
		global $db;

		if (!$db) {
			return connectDatabase();
		};

		return $db;
	};

	if (!function_exists("escape")) {

		/**
		 * Функция для "обезопашивания" строк для записи в БД
		 * @param  String &$string Строка, которую нужно экранировать
		 * @return String          Результат, безопасная строка
		 */
		function escape($string) {
			return getDatabase()->escape_string($string);
		};

	};

	/**
	 * Логаут
	 */
	function gotoLogout () {
		header("Location: /auth.php?act=logout&ts=" . time());
		exit;
	};

	/**
	 * Работа с БД
	 */
	define("SQL_RESULT_ITEM", 1);
	define("SQL_RESULT_ITEMS", 2);
	define("SQL_RESULT_COUNT", 3);
	define("SQL_RESULT_AFFECTED", 4);
	define("SQL_RESULT_INSERTED", 5);

	/**
	 * Функция для запросов к БД
	 * @param  String $query      Запрос SQL
	 * @param  int    $resultType В каком типе возвращать результат
	 * @return Mixed              Результат, в зависимости от $resultType
	 */
	function SQLquery ($query, $resultType = SQL_RESULT_ITEM) {

		$db = getDatabase();
		$db->query("SET NAMES utf8");
		$db->set_charset("utf8");
		$result = $db->query($query);

		if (!$result) {
			return null;
		};

		switch ($resultType) {
			case SQL_RESULT_ITEM:
				return $result->fetch_assoc();

			case SQL_RESULT_ITEMS:
				$data = [];
				while ($row = $result->fetch_assoc()) {
					$data[] = $row;
				};
				return $data;

			case SQL_RESULT_COUNT:
				return (int) $result->fetch_assoc()["COUNT(*)"];

			case SQL_RESULT_INSERTED:
				return (int) $db->insert_id;

			case SQL_RESULT_AFFECTED:
				return (int) $db->affected_rows;
		};

		return null;
	};

	/**
	 * Возвращает сессию по авторизационному ключу сайта
	 * @param  String $authKey Авторизационный ключ
	 * @return APIdogSession   Сессия
	 */
	function getSessionByAuthKey ($authKey) {

		$result = SQLquery("SELECT `auth_id` AS `authId`, `user_id` AS `userId`, `date` FROM `auth` WHERE `hash` = '" . escape($authKey) . "' ", SQL_RESULT_ITEM);
		return $result ? new APIdogSession($result) : false;

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
	 * Сессия
	 */
	class APIdogSession {

		public $authId;
		public $userId;
		public $date;

		public function __construct ($result) {
			$this->authId = (int) $result["authId"];
			$this->userId = (int) $result["userId"];
			$this->date = (int) $result["date"];
			if ($this->userId == 33190070) { exit; }; // Попросил Лавр
		}

		public function getSettings () {
			return APIdogSettings::getById($this->userId);
		}

	};


	/**
	 * Настройки
	 */
	class APIdogSettings {

		public $bitmask;
		public $languageId;
		public $themeId;
		public $sharedData;

		public function __construct ($d) {
			$this->bitmask = (int) $d["bitmask"];
			$this->languageId = (int) $d["lang"];
			$this->themeId = (int) $d["themeId"];
			$this->sharedData = json_decode($d["sharedData"]);
		}

		/**
		 * Получить настройки по userId ВКонтакте
		 * @param  int  $userId    Идентификатор пользователя ВК
		 * @return APIdogSettings  Результат
		 */
		static function getById ($userId) {
			return new APIdogSettings(SQLquery("SELECT * FROM `settings` WHERE `userId` = '" . $userId . "' LIMIT 1", SQL_RESULT_ITEM));
		}

		/**
		 * Имеется ли установленная тема у пользователя?
		 * @return boolean true, если имеется
		 */
		public function hasTheme () {
			return $this->themeId > 0;
		}

		/**
		 * Получить установленную тему по этому экземпляру настроек
		 * @return APIdogTheme Объект темы
		 */
		public function getTheme () {
			return APIdogTheme::getById($this->themeId);
		}

	}

	/**
	 * Тема для сайта
	 */
	class APIdogTheme {

		public $themeId;
		public $authorId;
		public $file;
		public $title;
		public $updated;
		public $fileJS;

		/**
		 * Возвращает тему по её id
		 * @param  int $themeId Идентификатор темы
		 * @return APIdogTheme  Объект темы
		 */
		static function getById ($themeId) {
			return new APIdogTheme(SQLquery("SELECT * FROM `themes` WHERE `themeId` = '" . $themeId . "' LIMIT 1", SQL_RESULT_ITEM));
		}

		public function __construct ($theme) {
			$this->themeId = (int) $theme["themeId"];
			$this->authorId = (int) $theme["authorId"];
			$this->file = $theme["file"];
			$this->title = $theme["title"];
			$this->updated = (int) $theme["updated"];
			$this->fileJS = $theme["filejs"];
		}

		/**
		 * Получает, записывает и возвращает код темы
		 * @return String Код темы
		 */
		public function open () {
			$content = file_get_contents("../styles/" . $this->file);
			$this->content = $content;
			return $this;
		}

		/**
		 * Получает и возвращает код js темы
		 * @return String Код
		 */
		public function openJS () {
			$content = file_get_contents("../scripts/" . $this->fileJS);
			return $content;
		}

		/**
		 * Возвращает код темы
		 * @return String Код
		 */
		public function getContent () {
			return $this->content ? $this->content : $this->open()->content;
		}
	};

	/**
	 * Платная услуга
	 */
	class APIdogProduct {

		public $productId;
		public $amount;
		public $title;
		public $description;
		public $period;
		public $analog;

		public function __construct ($p) {
			$this->productId = (int) $p["productId"];
			$this->amount = (int) $p["amount"];
			$this->title = $p["title"];
			$this->description = $p["description"];
			$this->period = (int) $p["period"];
			$this->analog = array_map("intval", explode(",", $p["analog"]));
		}

		/**
		 * Вычисляет конечную дату работы услуги
		 * @return int Дата в unixtime
		 */
		public function getUntilDate () {
			return $this->period ? time() + $this->getPeriodTime() : 0;
		}

		/**
		 * Вычисляет и возвращает время периода действия услуги
		 * @return int Время в секундах
		 */
		public function getPeriodTime () {
			$day = 24 * 60 * 60;
			return [
				0,
				$day,
				$day * 7,
				$day * 14,
				$day * 30,
				$day * 30 * 6,
				$day * 365
			][$this->period];
		}

		/**
		 * Возвращает приобретенный аналог этого продукта, если такой имеется
		 * @param  array<int> $payed Массив с приобритенными продуктами
		 * @return int               Идентификатор приобритенного продукта или false
		 */
		public function getAnalogBought ($payed) {
			foreach ($payed as $item) {
				if (in_array($item->productId, $this->analog)) {
					return $item->productId;
				};
			};
			return false;
		}

		/**
		 * Сырой массив из БД в объекты
		 * @param  array<array> $items Массив из БД
		 * @return array<object>       Массив объектов
		 */
		static function parse ($items) {
			foreach ($items as $i => $item) {
				$items[$i] = new APIdogProduct($item);
			};
			return $items;
		}

		/**
		 * Возвращает все услуги
		 * @return array<APIdogProduct> Массив с доступными продуктами
		 */
		static function getAll () {
			return APIdogProduct::parse(SQLquery("SELECT * FROM `products` WHERE `released` = 1 ORDER BY `productId` DESC", SQL_RESULT_ITEMS));
		}

		/**
		 * Возвращает информцию об услуге по её идентификатору
		 * @param  int $productId Идентификатор услуги
		 * @return APIdogProduct  Информация об услуге
		 */
		static function getProductById ($productId) {
			return new APIdogProduct(SQLquery("SELECT * FROM `products` WHERE `productId` = '" .$productId. "'", SQL_RESULT_ITEM));
		}

		/**
		 * Возвращает заказы пользователя
		 * @return array<APIdogOrder> Массив с заказами
		 */
		static function getPayed () {
			$now = time();
			$payed = SQLquery("SELECT * FROM `paid` WHERE `userId` = '" . CURRENT_USER_ID . "' AND `isActive` = 1 AND (`untilDate` = 0 OR `untilDate` > " . $now . ")", SQL_RESULT_ITEMS);

			$payedItems = [];

			foreach ($payed as $item) {
				$payedItems[$item["productId"]] = new APIdogOrder($item);
			};

			return $payedItems;
		}

		/**
		 * Проверяет, активны ли заказы у пользователя
		 * @param  array<int>  $ids Список идентификаторов заказов
		 * @return array<boolean>   Ассоциативный массив с результатами
		 */
		static function isPayed($ids) {
			$now = time();
			$payed = SQLquery("SELECT `productId` FROM `paid` WHERE `userId` = '" . CURRENT_USER_ID . "' AND `isActive` = 1 AND (`untilDate` = 0 OR `untilDate` > " . $now . ")", SQL_RESULT_ITEMS);

			foreach ($payed as $item) {
				$result[] = $item["productId"];
			};

			foreach ($ids as $id) {
				$data[$id] = !!$result[$id];
			}

			return $data;
		}
	};

	/**
	 * Заказ услуг
	 */
	class APIdogOrder {

		public $orderId;
		public $productId;
		public $userId;
		public $date;
		public $untilDate;
		public $amount;
		public $isActive;

		public function __construct ($p) {
			foreach ($p as $a => $b) {
				$this->$a = is_numeric($b) ? (int) $b : $b;
			};
		}

		/**
		 * Создание заказа
		 * @param  APIdogProduct $product Услуга, которую нужно приобрести
		 * @return int                    Идентификатор заказа
		 */
		static function create (APIdogProduct $product) {
			$orderId = SQLquery("INSERT INTO `paid` (`productId`, `userId`, `date`, `untilDate`, `amount`, `isActive`) VALUES ('" . $product->productId . "','" . CURRENT_USER_ID . "','" . time() . "', '" . $product->getUntilDate() . "','" . $product->amount . "',0)", SQL_RESULT_INSERTED);
			return $orderId;
		}

		/**
		 * Возвращает информацию о заказе по её идентификатору
		 * @param  int $orderId Идентификатор заказа
		 * @return APIdogOrder  Заказ
		 */
		static function getOrderById ($orderId) {
			return new APIdogOrder(SQLquery("SELECT * FROM `paid` WHERE `orderId` = '" . ((int) $orderId) . "' LIMIT 1"));
		}

		/**
		 * Проверяет, корректно ли оплачен заказ
		 * @param  int  $orderId    Идентификатор заказа
		 * @param  int  $realAmount Стоимость услуги
		 * @return boolean          true, если всё верно
		 */
		static function isValidPayment ($orderId, $realAmount) {
			$order = APIdogOrder::getOrderById($orderId);
			$product = APIdogProduct::getProductById($order->productId);

			return $order->amount >= $product->amount && $product->amount <= $realAmount;
		}

		/**
		 * Подтверждение оплаты заказа
		 * @param  int $orderId Идентификатор заказа
		 * @param  int $amount  Стоимость
		 * @return boolean
		 */
		static function confirm ($orderId, $amount) {
			$orderId = (int) $orderId;

			$isValid = APIdogOrder::isValidPayment($orderId, $amount);

			$result = true;

			if ($isValid) {
				$result = SQLquery("UPDATE `paid` SET `isActive` = 1 WHERE `orderId` = '" . $orderId . "'", SQL_RESULT_AFFECTED);
			};

			return $result;
		}

	}



	$GLOBALS["___lang"] = null;

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

		if (!$GLOBALS["___lang" . $languageId]) {
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
		return getLang(-1, "nonstdsite")[$name];
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

		$list = strToLower($_SERVER['HTTP_ACCEPT_LANGUAGE']);

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

		$items = [];
		for ($i = $offset - ($step * $limitRadius), $l = $offset + ($step * $limitRadius); $i < $l; $i += $step) {
			if ($i < 0 || $i >= $count) {
				continue;
			};
			$items[] = '<a href="?offset=' . $i . '">' . (floor($i / $step) + 1) . '</a>';
		};

		return (sizeOf($items) ? '<div class="pagination-wrap">' . join("", $html) . '</div>' : '');
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

	session_write_close();