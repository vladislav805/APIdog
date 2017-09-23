<?

	namespace Method\Theme;

	use Connection;
	use Controller;
	use Method\BaseMethod;
	use Model\Theme;

	class GetList extends BaseMethod {

		/** @var string */
		protected $sort;
		// "", "update", "create"

		/**
		 * GetList constructor.
		 * @param array $request
		 */
		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 */
		public function run(Controller $controller, Connection $db) {

			$sort = $this->sort === "update" ? "date" : ($this->sort === "installs" ? "installs" : "themeId");

			$userId = $controller->getSession()->getUserId();

			$themes = $db->query(sprintf("SELECT * FROM `theme` WHERE `isPrivate` = 0 OR `authorId` = '%d' ORDER BY `" . $sort . "` DESC LIMIT 400", $userId), $db::RESULT_ITEMS);
			$count = $db->query(sprintf("SELECT COUNT(*) FROM `theme` WHERE `isPrivate` = 0 OR `authorId` = '%d'", $userId), $db::RESULT_COUNT);

			foreach ($themes as &$theme) {
				$theme = new Theme($theme);
			}

			return ["count" => $count, "items" => $themes];

		}
	}