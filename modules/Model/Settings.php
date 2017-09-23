<?

	namespace Model;

	use JsonSerializable;

	class Settings implements JsonSerializable {

		/** @var int */
		private $bitmask;

		/** @var int */
		private $language;

		/** @var int */
		private $themeId;

		/**
		 * Settings constructor.
		 * @param array $d
		 */
		public function __construct($d) {
			$this->bitmask = (int) $d["bitmask"];
			$this->language = (int) $d["lang"];
			$this->themeId = (int) $d["themeId"];
		}

		/**
		 * @return int
		 */
		public function getBitmask() {
			return $this->bitmask;
		}

		/**
		 * @return int
		 */
		public function getLanguage() {
			return $this->language;
		}

		/**
		 * @return int
		 */
		public function getThemeId() {
			return $this->themeId;
		}

		/**
		 * Specify data which should be serialized to JSON
		 * @link  http://php.net/manual/en/jsonserializable.jsonserialize.php
		 * @return mixed data which can be serialized by <b>json_encode</b>,
		 * which is a value of any type other than a resource.
		 * @since 5.4.0
		 */
		public function jsonSerialize() {
			return [
				"bitmask" => $this->bitmask,
				"language" => $this->language,
				"themeId" => $this->themeId
			];
		}
	}