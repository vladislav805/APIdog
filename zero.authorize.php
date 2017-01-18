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

		private $apps = null;

		public function parseApplications() {

			if ($this->apps) {
				return;
			};

			$apps = file("./zero.applications.txt");

			foreach ($apps as &$app) {
				list($applicationId, $secretKey, $title) = explode(";", $app);
				$app = new AuthorizeApplication($application, $secretKey, $title);
			}

			$this->apps = $apps;
		}

		/**
		 * Возвращает данные приложения по его внутреннему id
		 * @param  int $appId Внутренний идентификатор приложения
		 * @return array      Данные приложения
		 */
		public function getApplicationById($appId) {

			$this->parseApplications();

			if (!($data = $this->apps[$appId])) {
				return false;
			};

			return $data;
		}

		/**
		 * Авторизация пользователя по прямой авторизации, используя прямую авторизацию
		 *
		 * @see https://vk.com/dev/auth_direct
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
			$request["client_id"] = $applicationInfo->getApplicationId();
			$request["client_secret"] = $applicationInfo->getSecretKey();
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
			 * Для приложений Android и iPhone scope передавать не нужно!
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
			curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
			curl_setopt($ch, CURLOPT_TIMEOUT, 15);
			$result = curl_exec($ch);
			$data = json_decode($result);
			curl_close($ch);

			/**
			 * Если произошла ошибка, разбираем её
			 */
			if ($data->error) {
				return $this->resolveError($data);
			};

			$authorize = new AuthorizeAccessToken($data, $applicationInfo);

			return $this->saveAuthorize($authorize);
		}

		/**
		 * Проверка валидности токена и создание авторизации на сайте
		 * @param  AuthorizeAccessToken  $authorize   Объект авторизации
		 * @return APIdogSession                      Сессия
		 */
		private function saveAuthorize($authorize) {
			if (!$authorize->checkToken()) {
				throw new ADInvalidAuthorizeException;
			};

			return APIdogSession::create($authorize);
		}

		/**
		 * Проверка токена на валидность
		 * В случае успеха, создание авторизации/сессии и её возврат
		 * @param  string $userAccessToken Пользовательский токен
		 * @param  int    $application     Внутренний идентификатор приложения
		 * @return array                   Данные с сессией
		 */
		public function checkToken($userAccessToken, $application) {








			$userId = (int) $test->user_id;

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

	class AuthorizeAccessToken {

		private $token;
		private $userId;
		private $expires;
		private $application;

		public function __construct($vkResponse, $application) {
			$this->token = $vkResponse->access_token;
			$this->userId = $vkResponse->user_id;
			$this->expires = $vkResponse->expires_in;
			$this->application = $application;
		}

		public function getAccessToken() {
			return $this->token;
		}

		public function getUserId() {
			return $this->userId;
		}

		public function getApplication() {
			return $this->application;
		}

		/**
		 * Проверка валидности токена
		 * @return	boolean	true, если токен валидный
		 */
		public function checkToken() {
			if (!$this->token) {
				throw new ADEmptyException;
			};

			// TODO: убрать говнокод
			$siteAccessToken = json_decode(file_get_contents("https://oauth.vk.com/access_token?client_id=" . $this->application->getApplicationId() . "&client_secret=" . $this->application->getSecretKey() . "&v=5.24&grant_type=client_credentials"))->access_token;
			$test = APIdog::api("secure.checkToken", [
				"access_token" => $siteAccessToken,
				"client_secret" => $this->application->getSecretKey(),
				"v" => 5.58,
				"token" => $this->token
			], true);

			if ($test->error) {
				throwError(41, ["source" => $test]);
			};

			return isset($test->response);
		}

	};

	class AuthorizeApplication {

		private $title;
		private $applicationId;
		private $secretKey;

		public function __construct($id, $key, $title) {
			$this->applicationId = $id;
			$this->secretKey = $key;
			$this->title = $title;
		}

		public function getApplicationId() {
			return $this->applicationId;
		}

		public function getSecretKey() {
			return $this->applicationId;
		}


		public function getTitle() {
			return $this->applicationId;
		}

	};