<?

	namespace Model;

	use stdClass;

	class VKSession {

		/** @var string */
		private $accessToken;

		/** @var int */
		private $userId;

		/** @var int */
		private $applicationId;

		/** @var string */
		private $secret;

		/**
		 * VKSession constructor.
		 * @param stdClass $d
		 * @param int      $appId
		 */
		public function __construct($d, $appId) {
			$this->accessToken = $d->access_token;
			$this->userId = $d->user_id;
			$this->applicationId = $appId;
			//$this->secret = $d->secret;
		}

		/**
		 * @return int
		 */
		public function getUserId() {
			return $this->userId;
		}

		/**
		 * @return string
		 */
		public function getAccessToken() {
			return $this->accessToken;
		}

		/**
		 * @return int
		 */
		public function getApplicationId() {
			return $this->applicationId;
		}

		/**
		 * @return string
		 */
		public function getSecret() {
			return $this->secret;
		}

	}