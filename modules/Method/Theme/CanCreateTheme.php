<?

	namespace Method\Theme;

	use Connection;
	use Controller;
	use Method\BaseMethod;

	class CanCreateTheme extends BaseMethod {

		/**
		 * CheckFloodControl constructor.
		 * @param $request
		 */
		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * Some action of method
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 */
		public function run(Controller $controller, Connection $db) {
			$check = $db->query("SELECT COUNT(*) FROM `theme` WHERE `authorId` = " . $controller->getSession()->getUserId(), $db::RESULT_COUNT);
			return $check < 5;
		}
	}