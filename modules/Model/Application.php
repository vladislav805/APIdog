<?

	namespace Model;

	use stdClass;

	class Application {

		/** @var int */
		private $applicationVkId;

		/** @var int */
		private $applicationId;

		/** @var string */
		private $secret;

		/** @var string */
		private $title;

		/** @var boolean */
		private $needScope;

		/**
		 * Application constructor.
		 * @param stdClass $d
		 */
		public function __construct($d) {
			$this->applicationVkId = $d->id;
			$this->applicationId = $d->applicationId;
			$this->secret = $d->secret;
			$this->title = $d->title;
			$this->needScope = $d->needScope;
		}

		/**
		 * @return int
		 */
		public function getApplicationVkId() {
			return $this->applicationVkId;
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

		/**
		 * @return string
		 */
		public function getTitle() {
			return $this->title;
		}

		/**
		 * @return boolean
		 */
		public function isNeedScope() {
			return $this->needScope;
		}

	}