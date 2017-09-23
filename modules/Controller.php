<?

	use Model\Application;
	use Model\Session;

	class Controller {

		/** @var Connection */
		private $mConnection;

		/** @var Session */
		private $mSession;

		/** @var Application[] */
		private $mApplications;

		/**
		 * Controller constructor.
		 * @param Connection $db
		 */
		public function __construct($db) {
			$this->mConnection = $db;
		}

		/**
		 * Initialize user
		 * @param string $vkAccessToken
		 * @param string $authKey
		 * @param string $salt
		 */
		public function init($vkAccessToken, $authKey, $salt) {
			$this->mConnection->escape($vkAccessToken);
			$this->mConnection->escape($authKey);

			try {
				/** @var Session $session */
				$session = $this->perform(new \Method\Session\GetByAuthKey(["authKey" => $authKey]));
				$session->setAccessToken($vkAccessToken);

				$checkSalt = $this->perform(new \Method\Authorize\CreateSalt(["accessToken" => $session->getAccessToken(), "userId" => $session->getUserId()]));

				if ($salt && $salt !== $checkSalt) {
					throw new APIdogException(ErrorCode::AUTH_KEY_INVALID);
				}
			} catch (APIdogException $e) {
				$session = Session::getInvalid();
			}

			$this->setSession($session);
		}

		/**
		 * @param Session $session
		 * @return $this
		 */
		private function setSession($session) {
			$this->mSession = $session;
			return $this;
		}

		/**
		 * @return Session
		 */
		public function getSession() {
			return $this->mSession;
		}

		/**
		 * Execute some method
		 * @param IMethod $method
		 * @return mixed
		 */
		public function perform(IMethod $method) {
			return $method->run($this, $this->mConnection);
		}

		/**
		 * Return application info
		 * @param $applicationId
		 * @return Application
		 * @throws APIdogException
		 */
		public function getApplication($applicationId) {
			if (!$this->mApplications) {
				$this->parseApplications();
			}

			if (!isset($this->mApplications[$applicationId])) {
				throw new APIdogException(ErrorCode::AUTHORIZE_HAS_ERROR_INVALID_APPLICATION);
			}

			return $this->mApplications[$applicationId];
		}

		/**
		 * Parse applications file
		 * @return array
		 */
		private function parseApplications() {
			$json = json_decode(file_get_contents("application.json"));
			$db = [];

			foreach ($json as $item) {
				$db[] = new Application($item);
			}

			return $this->mApplications = $db;
		}

	}