<?

	/**
	 * Работа с пользовательской частью
	 */

	/**
	 * Возвращает токен из кук
	 * @return String access_token
	 */
	function getAccessToken() {
		return defined("userAccessToken") ? userAccessToken : null;
	};

	/**
	 * Возвращает ключ авторизации от APIdog
	 * @return String authKey
	 */
	function getAuthKey() {
		return defined("userAuthKey") ? userAuthKey : null;
	};

	/**
	 * Возвращает сессию по авторизационному ключу сайта
	 * @param  String $authKey Авторизационный ключ
	 * @return APIdogSession   Сессия
	 */
	function getSessionByAuthKey ($authKey) {
		$authKey = escape($authKey);
		$result = SQLquery("SELECT `auth_id` AS `authId`, `user_id` AS `userId`, `date` FROM `auth` WHERE `hash` = '" . $authKey . "' ", SQL_RESULT_ITEM);
		return $result ? new APIdogSession($result) : false;

	};

	/**
	 * Логаут
	 */
	function gotoLogout () {
		header("Location: auth.php?act=logout&ts=" . time());
		exit;
	};

	/**
	 * Сессия
	 */
	class APIdogSession {

		private $authId;
		private $userId;
		private $date;

		public function __construct($result) {
			$this->authId = (int) $q["auth_id"];
			$this->authKey = $q["hash"];
			$this->userId = $q["user_id"];
			$this->date = (int) $q["date"];
			$this->appId = (int) $q["appId"];
		}

		public function getSettings() {
			return APIdogSettings::getById($this->userId);
		}

		/**
		 * Создание сессии и генерация authKey
		 * @param  AuthorizeAccessToken $authorize Результат от авторизации
		 * @return APIdogSession                   Сессия
		 */
		static function create(AuthorizeAccessToken $authorize) {
			$date = time();
			$authKey = md5(time() . $authorize->getUserId());

			$query = sprintf("INSERT INTO `auth` (`user_id`, `date`, `hash`, `appId`) VALUES (%d,%d,'%s','%s')", $userId, $date, $hash, $authorize->getApplication()->getApplicationId());

			$authId = SQLquery($query, SQL_RESULT_INSERTED);

			return new APIdogSession([
				"user_id" => $authorize->getUserId(),
				"auth_id" => $authId,
				"hash" => $authKey,
				"date" => $date,
				"appId" => $authorize->getApplication()->getApplicationId()
			]);
		}

		/**
		 * Получение пользователя по authKey
		 * @param  string $authKey authKey
		 * @return [type]       [description]
		 */
		static function getByAuthKey($authKey = false) {
			if (!$authKey) {
				return false;
			};

			$user = SQLquery("SELECT * FROM `auth` WHERE `hash`='" . escape($authKey) . "' LIMIT 1", SQL_RESULT_ITEM);
			return !$user ? false : new APIdogSession($user);
		}

		/**
		 * Завершить сессию
		 * @return boolean true, если успешно
		 */
		public function kill() {
			return (boolean) SQLquery("DELETE FROM `auth` WHERE `auth_id` = '" . $this->authId . "' LIMIT 1", SQL_RESULT_AFFECTED);
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

	};

	/**
	 * Класс пользователя
	 */
	class User {
		public $userId;
		public $firstName;
		public $lastName;
		public $photo50;
		public $online;

		public function __construct ($u) {
			$this->userId = (int) ($u["id"] ? $u["id"] : $u["uid"]);
			$this->firstName = $u["first_name"];
			$this->lastName = $u["last_name"];
			$this->photo50 = $u["photo_50"] ? $u["photo_50"] : $u["photo_rec"];
			$this->online = (boolean) $u["online"];
		}

		/**
		 * Ассоциирование ключа authKey с userId
		 * @deprecated
		 * @param  string $authKey Авторизационный ключ сайта
		 * @param  int    $authId  Идентификатор авторизации
		 * @param  int    $userId  Идентификатор пользователя
		 * @return array           Данные
		 */
		static function associateAuthKey($authKey, $authId, $userId) { }
	};