<?

	namespace Method\Authorize;

	use APIdogException;
	use APIdogVKException;
	use Connection;
	use Controller;
	use ErrorCode;
	use Method\BaseMethod;
	use Method\Session\Add;
	use Method\VK\RefreshToken;
	use Model\VKSession;
	use stdClass;
	use Tools\Request;

	class Login extends BaseMethod {

		const VK_AUTH_ERROR_INVALID_CLIENT = "invalid_client";
		const VK_AUTH_ERROR_NEED_VALIDATION ="need_validation";
		const VK_AUTH_ERROR_NEED_CAPTCHA = "need_captcha";


		/** @var string */
		protected $login;

		/** @var string */
		protected $password;

		/** @var int */
		protected $application;

		/** @var int */
		protected $captchaId;

		/** @var string */
		protected $captchaKey;

		/** @var string */
		protected $validationId;

		/** @var string */
		protected $validationCode;

		/**
		 * Login constructor.
		 * @param $request
		 */
		public function __construct($request) {
			parent::__construct($request);
			$this->application = (int) $this->application;
		}

		/**
		 * Some action of method
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 * @throws APIdogException
		 */
		public function run(Controller $controller, Connection $db) {
			if (!$this->login || !$this->password || !$this->application) {
				throw new APIdogException(ErrorCode::INVALID_PARAM);
			};

			$app = $controller->getApplication($this->application);

			$params = [
				"grant_type" => "password",
				"password" => $this->password,
				"scope" => "all",
				"2fa_supported" => 1,
				"v" => 5.67,
				"client_secret" => $app->getSecret(),
				"client_id" => $app->getApplicationVkId(),
				"username" => $this->login,
				"force_sms" => 1
			];

			if ($this->validationId && $this->validationCode) {
				$params["validation_sid"] = $this->validationId;
				$params["code"] = str_replace(" ", "", $this->validationCode);
			}

			if ($app->isNeedScope()) {
				$params["scope"] = 2047135; // 2064127;
			}

			if ($this->captchaId && $this->captchaKey) {
				$params["captcha_sid"] = $this->captchaId;
				$params["captcha_key"] = $this->captchaKey;
			}

			$request = new Request("https://api.vk.com/oauth/token", true);
			$request->setUserAgent(VK_SHIT_USER_AGENT);
			$request->setParams($params);
			$request->send();

			$result = $request->getJSON();

			if (isset($result->error)) {
				throw $this->resolveError($result);
			}

			$vkSession = new VKSession($result, $app->getApplicationId());

			$p = ["vk" => $vkSession];

			if (!$controller->perform(new CheckToken($p))) {
				throw new APIdogException(ErrorCode::AUTHORIZE_HAS_ERROR_WHILE_CHECK);
			}

			/** @var \Model\Session $session */
			$session = $controller->perform(new Add($p));

			$session->setAccessToken($vkSession->getAccessToken());


			//$res = $controller->perform(new RefreshToken(["token" => $vkSession->getAccessToken()]));

			$session->computeSalt($controller);

			return $session;
		}

		/**
		 * @param stdClass $e
		 * @return APIdogException
		 */
		private function resolveError($e) {
			switch ($e->error) {

				case self::VK_AUTH_ERROR_INVALID_CLIENT:
					return new APIdogException(ErrorCode::AUTHORIZE_HAS_ERROR_INVALID_CLIENT, $e);

				case self::VK_AUTH_ERROR_NEED_CAPTCHA:
					return new APIdogException(ErrorCode::AUTHORIZE_HAS_ERROR_CAPTCHA, [
						"captchaId" => $e->captcha_sid,
						"captchaImg" => $e->captcha_img
					]);

				case self::VK_AUTH_ERROR_NEED_VALIDATION:
					return new APIdogException(ErrorCode::AUTHORIZE_HAS_ERROR_2FA, [
						"type" => $e->validation_type,
						"validationId" => $e->validation_sid,
						"phone" => $e->phone_mask
					]);
			}

			return new APIdogException(ErrorCode::AUTHORIZE_HAS_ERROR, $e);
		}

	}