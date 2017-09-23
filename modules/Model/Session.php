<?

	namespace Model;

	use Controller;
	use JsonSerializable;
	use Method\Authorize\CreateSalt;

	class Session implements JsonSerializable {

		/** @var int */
		private $authId;

		/** @var int */
		private $userId;

		/** @var int */
		private $date;

		/** @var string */
		private $authKey;

		/** @var int */
		private $applicationId;

		/** @var string */
		private $accessToken;

		/** @var string|null */
		private $salt;

		/**
		 * Session constructor.
		 * @param array $d
		 */
		public function __construct($d) {
			$this->authId = (int) $d["authId"];
			$this->authKey = $d["authKey"];
			$this->userId = (int) $d["userId"];
			$this->date = (int) $d["date"];
			$this->applicationId = (int) $d["applicationId"];
		}

		/**
		 * @return int
		 */
		public function getAuthId() {
			return $this->authId;
		}

		/**
		 * @return int
		 */
		public function getUserId() {
			return $this->userId;
		}

		/**
		 * @return int
		 */
		public function getDate() {
			return $this->date;
		}

		/**
		 * @return string
		 */
		public function getAuthKey() {
			return $this->authKey;
		}

		/**
		 * @return int
		 */
		public function getApplicationId() {
			return $this->applicationId;
		}

		/**
		 * @return boolean
		 */
		public function isAuthorized() {
			return $this->authId > 0 && $this->userId;
		}

		/**
		 * @param string $vkAccessToken
		 * @return $this
		 */
		public function setAccessToken($vkAccessToken) {
			$this->accessToken = $vkAccessToken;
			return $this;
		}

		/**
		 * @return string
		 */
		public function getAccessToken() {
			return $this->accessToken;
		}

		/**
		 * @param Controller $controller
		 * @return $this
		 */
		public function computeSalt(Controller $controller) {
			$this->salt = $controller->perform(new CreateSalt(["accessToken" => $this->accessToken, "userId" => $this->userId]));
			return $this;
		}

		/**
		 * @return Session
		 */
		public static function getInvalid() {
			return new Session([
				"authId" => -1,
				"authKey" => "000",
				"userId" => 0,
				"date" => 0,
				"applicationId" => 0
			]);
		}

		/**
		 * JSON
		 */
		public function jsonSerialize() {
			$json = [
				"authKey" => $this->getAuthKey(),
				"authId" => $this->getAuthId(),
				"userId" => $this->getUserId(),
				"date" => $this->getDate(),
				"applicationId" => $this->getApplicationId()
			];

			if ($this->accessToken) {
				$json["accessToken"] = $this->getAccessToken();
				$json["salt"] = $this->salt;
			}

			return $json;
		}
	}