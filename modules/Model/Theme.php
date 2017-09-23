<?

	namespace Model;

	use JsonSerializable;

	class Theme implements JsonSerializable {

		/** @var int */
		protected $themeId;

		/** @var int */
		protected $authorId;

		/** @var int */
		protected $date;

		/** @var string */
		protected $title;

		/** @var string */
		protected $version;

		/** @var string */
		protected $changelog;

		/** @var string */
		protected $fileCSS;

		/** @var string|null */
		protected $fileJS;

		/** @var boolean */
		protected $isPrivate;

		/** @var boolean */
		protected $isVerified;

		/** @var int */
		protected $installCount;

		/**
		 * Theme constructor.
		 * @param array $p
		 */
		public function __construct($p) {
			$this->themeId = (int) $p["themeId"];
			$this->authorId = (int) $p["authorId"];
			$this->title = $p["title"];
			$this->version = $p["version"];
			$this->fileCSS = $p["fileCSS"];
			$this->date = (int) $p["date"];
			$this->changelog = $p["changelog"];
			$this->isPrivate = (boolean) $p["isPrivate"];
			$this->isVerified = (boolean) $p["isVerified"];
			$this->installCount = (int) $p["installCount"];
		}

		/**
		 * @return int
		 */
		public function getThemeId() {
			return $this->themeId;
		}

		/**
		 * @return int
		 */
		public function getAuthorId() {
			return $this->authorId;
		}

		/**
		 * @return bool|string
		 */
		public function getContentCSS() {
			return file_get_contents("user/theme/" . $this->fileCSS);
		}

		/**
		 * @return bool|string
		 */
		public function getContentJS() {
			return file_get_contents("user/theme/" . $this->fileJS);
		}

		/**
		 * @return string
		 */
		public function getFileCSS() {
			return $this->fileCSS;
		}

		/**
		 * @return null|string
		 */
		public function getFileJS() {
			return $this->fileJS;
		}


		/*

		public function getInstalledUsersCount ()
		{
			$n = APIdog::mysql("SELECT COUNT(*) FROM `settings` WHERE `themeId` = '" . $this->themeId . "'", 3);
			$this->installs = (int) $n;
			return $n;
		}



*/

		/**
		 * Specify data which should be serialized to JSON
		 * @link  http://php.net/manual/en/jsonserializable.jsonserialize.php
		 * @return mixed data which can be serialized by <b>json_encode</b>,
		 * which is a value of any type other than a resource.
		 * @since 5.4.0
		 */
		public function jsonSerialize() {
			return [
				"themeId" => $this->themeId,
				"authorId" => $this->authorId,
				"date" => $this->date,
				"title" => $this->title,
				"changelog" => $this->changelog,
				"fileCSS" => $this->fileCSS,
				"fileJS" => $this->fileJS,
				"isPrivate" => $this->isPrivate,
				"isVerified" => $this->isVerified,
				"installCount" => $this->installCount
			];
		}
	}