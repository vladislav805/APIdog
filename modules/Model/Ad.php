<?

	namespace Model;

	use JsonSerializable;

	class Ad implements JsonSerializable {

		/** @var int */
		private $id;

		/** @var boolean */
		private $active;

		/** @var string */
		private $link;

		/** @var int */
		private $type;

		/** @var string */
		private $image;

		/** @var string */
		private $title;

		/** @var string */
		private $description;

		/** @var int */
		private $ownerId;

		/** @var int */
		private $dateStart;

		/** @var int */
		private $dateEnd;

		/** @var int */
		private $views;

		/** @var int */
		private $clicks;

		/**
		 * Ad constructor.
		 * @param array $a
		 */
		public function __construct($a) {
			$this->id = (int) $a["id"];
			$this->active = (boolean) $a["active"];
			$this->link = $a["link"];
			$this->type = (int) $a["type"];
			$this->title = $a["title"];
			$this->description = $a["description"];
			$this->image = $a["image"];
			$this->ownerId = (int) $a["ownerId"];
			$this->dateStart = (int) $a["dateStart"];
			$this->dateEnd = (int) $a["dateEnd"];
			$this->views = (int) $a["views"];
			$this->clicks = (int) $a["clicks"];
		}

		/**
		 * @return int
		 */
		public function getId() {
			return $this->id;
		}

		/**
		 * @return int
		 */
		public function getType() {
			return $this->type;
		}

		/**
		 * @return string
		 */
		public function getImage() {
			return $this->image;
		}

		/**
		 * @return string
		 */
		public function getTitle() {
			return $this->title;
		}

		/**
		 * @return string
		 */
		public function getDescription() {
			return $this->description;
		}

		/**
		 * @return string
		 */
		public function getLink() {
			return $this->link;
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
				"adId" => $this->id,
				"adLink" => "//apidog.ru/ads.php?adId=" . $this->id,
				"adImage" => "//static.apidog.ru/images/a/" . $this->image,
				"title" => $this->title,
				"description" => $this->description,
				"type" => $this->type
			];
		}
	}