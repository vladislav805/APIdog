<?

	class APIdogVKException extends APIdogException {

		/** @var mixed */
		private $data;

		/**
		 * APIdogLoginException constructor.
		 * @param int   $code
		 * @param array $params
		 */
		public function __construct($code = 0, $params = []) {
			parent::__construct($code);
		}

		public function jsonSerialize() {
			$data = parent::jsonSerialize();

			$data["data"] = $this->data;

			return $data;
		}

	}