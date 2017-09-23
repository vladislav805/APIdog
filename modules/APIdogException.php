<?

	class APIdogException extends Exception implements JsonSerializable {

		/** @var mixed */
		private $extra;

		/**
		 * APIdogException constructor.
		 * @param int  $code
		 * @param null $extra
		 */
		public function __construct($code = 0, $extra = null) {
			parent::__construct(null, $code);
			$this->extra = $extra;
		}

		/**
		 * Specify data which should be serialized to JSON
		 * @link  http://php.net/manual/en/jsonserializable.jsonserialize.php
		 * @return mixed data which can be serialized by <b>json_encode</b>,
		 * which is a value of any type other than a resource.
		 * @since 5.4.0
		 */
		public function jsonSerialize() {
			$d = ["errorId" => $this->getCode()];

			if ($this->extra) {
				$d["extra"] = $this->extra;
			}

			return $d;
		}

	}