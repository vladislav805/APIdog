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

		public $authId;
		public $userId;
		public $date;

		public function __construct ($result) {
			$this->authId = (int) $result["authId"];
			$this->userId = (int) $result["userId"];
			$this->date = (int) $result["date"];
		}

		public function getSettings () {
			return APIdogSettings::getById($this->userId);
		}

		/**
		 * Получение пользователя по authKey
		 * @param  string $authKey authKey
		 * @return [type]       [description]
		 */
		static function getByAuthKey($authKey = "") {
			if (!$authKey) {
				return false;
			};

			$user = SQLquery("SELECT * FROM `auth` WHERE `hash`='" . escape($authKey) . "' LIMIT 1", SQL_RESULT_ITEM);
			return !$user ? false : new APIdogSession($user);
		}

	};

	/**
	 * Авторизационная сессия
	 */
	class AuthSession {
		public $authId;
		public $authKey;
		private $userId;
		public $date;
		public $appId;

		public function __construct($q) {
			$this->authId = (int) $q["auth_id"];
			$this->authKey = $q["hash"];
			$this->userId = $q["user_id"];
			$this->date = (int) $q["date"];
			$this->appId = (int) $q["appId"];
		}

		public function getUserId() {
			return $this->userId;
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