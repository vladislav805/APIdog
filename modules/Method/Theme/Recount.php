<?

	namespace Method\Theme;

	use Connection;
	use Controller;
	use Method\BaseMethod;

	class Recount extends BaseMethod {

		/** @var int */
		protected $themeId;

		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 */
		public function run(Controller $controller, Connection $db) {
			$n = $db->query(sprintf("SELECT COUNT(*) FROM `settings` WHERE `themeId` = '%d'", $this->themeId), $db::RESULT_COUNT);
			return $db->query(sprintf("UPDATE `theme` SET `installCount` = '%d' WHERE `themeId` = '%d' LIMIT 1", $n, $this->themeId), $db::RESULT_AFFECTED);
		}

	}