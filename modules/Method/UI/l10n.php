<?

	namespace Method\UI;

	use Connection;
	use Controller;
	use Method\BaseMethod;

	/**
	 * Get localization
	 * @property string menuMail
	 * @property string menuFeed
	 * @property string menuNotifications
	 * @property string menuPhotos
	 * @property string menuFriends
	 * @property string menuGroups
	 * @property string menuAudios
	 * @property string menuVideos
	 * @property string menuDocuments
	 * @property string menuFaves
	 * @property string menuSearch
	 * @property string menuSettings
	 * @property string menuDonate
	 * @property string menuLogoutConfirmation
	 * @property string menuLogout
	 * @property string menuAdvertisements
	 * @package Method\UI
	 */
	class l10n extends BaseMethod {

		protected $languageId;

		private $mData;

		/**
		 * l10n constructor.
		 * @param $request
		 */
		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * Some action of method
		 * @param Controller $controller
		 * @param Connection $db
		 * @return l10n
		 */
		public function run(Controller $controller, Connection $db) {
			$sql = sprintf("SELECT `label`, `content` FROM `language` WHERE `languageId` = '%d'", $this->languageId);
			$data = $db->query($sql, $db::RESULT_ITEMS);

			$this->mData = $this->toAssoc($data);
			return $this;
		}

		/**
		 * @param array $d
		 * @return array
		 */
		private function toAssoc($d) {
			$o = [];
			foreach ($d as $item) {
				$o[$item["label"]] = $item["content"];
			}
			return $o;
		}

		/**
		 * @param string $name
		 * @return string
		 */
		public function __get($name) {
			return isset($this->mData[$name]) ? $this->mData[$name] : "%" . $name . "%";
		}
	}