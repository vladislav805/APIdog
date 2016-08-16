<?

	/**
	 * Работа с авторизацией
	 */

	include_once "zero.config.php";

	global $authApps;

	define("VK_AUTH_ERROR_INVALID_CLIENT", "invalid_client");
	define("VK_AUTH_ERROR_NEED_VALIDATION", "need_validation");
	define("VK_AUTH_ERROR_NEED_CAPTCHA", "need_captcha");

	class Authorize {

		/**
		 * Возвращает данные приложения по его внутреннему id
		 * @param  int $appId Внутренний идентификатор приложения
		 * @return array      Данные приложения
		 */
		public static function getApplicationById($appId) {

			global $authApps;

			if (!($data = $authApps[$appId])) {
				return false;
			};

			return $data;
		}

		/**
		 * Авторизация пользователя по прямой авторизации, используя прямую авторизацию
		 *
		 * @see https://new.vk.com/dev/auth_direct
		 * @param  string  $login          Логин/e-mail/телефон
		 * @param  string  $password       Пароль
		 * @param  int     $application    Внутренний идентификатор приложения
		 * @param  int     $captchaId      Идентификатор капчи (если есть)
		 * @param  string  $captchaKey     Введенный код капчи (если есть)
		 * @param  string  $validationId   Идентификатор валидации (если есть)
		 * @param  string  $validationCode Введенные код валидации (если есть)
		 * @return array                   Данные сессии
		 */
		public function requestByPairLoginPassword($login, $password, $application = null, $captchaId = 0, $captchaKey = null, $validationId = null, $validationCode = null) {
			if (!$login || !$password || is_null($application)) {
				throwError(70);
			};

			$applicationInfo = $this->getApplicationById($application);

			$request = [];
			$request["grant_type"] = "password";
			$request["client_id"] = $applicationInfo[0];
			$request["client_secret"] = $applicationInfo[1];
			$request["username"] = $login;
			$request["password"] = $password;
			$request["v"] = 4.99;

			/**
			 * Данные для валидации
			 */
			if ($validationId && $validationCode) {
				$request["validation_sid"] = $validationId;
				$request["code"] = $validationCode;
			};

			/**
			 * Для приложений Android, iPhone scope передавать не нужно!
			 */
			if (in_array($application, [0, 3, 4, 6, 7, 8, 10])) {
				$request["scope"] = 2064127;
			};

			/**
			 * Если есть капча
			 */
			if ($captchaId && $captchaKey) {
				$request["captcha_sid"] = $captchaId;
				$request["captcha_key"] = $captchaKey;
			};

			$url = "https://oauth.vk.com/token?" . http_build_query($request);

			$ch = curl_init($url);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			$result = curl_exec($ch);
			$data = json_decode($result);
			curl_close($ch);

			/**
			 * Если произошла ошибка, разбираем её
			 */
			if ($data->error) {
				return $this->resolveError($data);
			};

			return $this->saveAuthorize($data->access_token, $application);
		}

		/**
		 * Проверка валидности токена и создание авторизации на сайте
		 * @param  string  $userAccessToken Токен
		 * @param  int     $application     Внутренний идентификатор выбранного приложения
		 * @return array                    Сессия
		 */
		public function saveAuthorize($userAccessToken, $application = 0) {
			$session = $this->checkToken($userAccessToken, $application);
			$session["userAccessToken"] = $userAccessToken;
			$session["application"] = $application;
			return $session;
		}

		/**
		 * Проверка токена на валидность
		 * В случае успеха, создание авторизации/сессии и её возврат
		 * @param  string $userAccessToken Пользовательский токен
		 * @param  int    $application     Внутренний идентификатор приложения
		 * @return array                   Данные с сессией
		 */
		public function checkToken($userAccessToken, $application) {

			if (is_null($application) || !is_int($application)) {
				throwError(40);
			};

			if (!$userAccessToken) {
				throwError(42);
			};

			$app = $this->getApplicationById($application);

			if (!$app) {
				throwError(71);
			};

			$accessToken = json_decode(file_get_contents("https://oauth.vk.com/access_token?client_id=" . $app[0] . "&client_secret=" . $app[1] . "&v=5.24&grant_type=client_credentials"))->access_token;
			$test = APIdog::api("secure.checkToken", [
				"access_token" => $accessToken,
				"v" => 5.0,
				"token" => $userAccessToken,
				"client_secret" => $app[1]
			], true);

			if ($test->error) {
				throwError(41);
			};

			$test = $test->response;
			$userId = (int) $test->user_id;
			$date = (int) time();
			$hash = md5(time());

			$q = SQLquery("INSERT INTO `auth` (`user_id`, `date`, `hash`, `appId`) VALUES ('" . $userId . "', '" . $date . "', '" . $hash . "','" . $application . "')", SQL_RESULT_INSERTED);

			return [
				"userId" => $userId,
				"authId" => $q,
				"authKey" => $hash,
				"date" => $date
			];
		}

		/**
		 * Разбор ошибок при авторизации
		 * @param  array $error Ошибка
		 */
		public function resolveError($error) {
			switch ($error->error) {
				/*
				 * Неверный лог/пасс
				 */
				case VK_AUTH_ERROR_INVALID_CLIENT:
					throwError(72, $error);
					break;

				/*
				 * Капча
				 */
				case VK_AUTH_ERROR_NEED_CAPTCHA:
					throwError(73, [
						"captchaId" => $error->captcha_sid,
						"captchaImg" => $error->captcha_img,
						"o" => $error
					]);
					break;

				/*
				 * Валидация
				 */
				case VK_AUTH_ERROR_NEED_VALIDATION:
					throwError(74, [
						"validationId" => $error->validation_sid,
						"phone" => $error->phone_mask,
						"o" => $error
					]);
					break;

				/*
				 * Что-то другое О_о
				 */
				default:
					throwError(69, $error);
			};
		}
	};