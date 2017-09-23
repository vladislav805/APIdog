<?

	namespace Method\Theme;

	use Connection;
	use Controller;
	use Method\BaseMethod;

	class GetUsers extends BaseMethod {

		/** @var int */
		protected $themeId;

		/** @var int */
		protected $count = 50;

		/** @var int */
		protected $offset = 0;

		/**
		 * GetUsers constructor.
		 * @param $request
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
			$count = $db->query(sprintf("SELECT COUNT(*) FROM `settings` WHERE `themeId` = '%d'", $this->themeId), $db::RESULT_COUNT);
			$userIds = $db->query(sprintf("SELECT `userId` FROM `settings` WHERE `themeId` = '%d' LIMIT " . ((int) $this->offset) . "," . ((int) $this->count), $this->themeId), $db::RESULT_ITEMS);

			return [
				"count" => $count,
				"items" => array_map(function($i) { return (int) $i["userId"]; }, $userIds)
			];
		}
	}