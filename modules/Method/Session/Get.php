<?

	namespace Method\Session;

	use Connection;
	use Controller;
	use Method\BaseMethod;
	use Model\Session;

	class Get extends BaseMethod {

		/**
		 * Get constructor.
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
			$sql = sprintf("SELECT * FROM `auth` WHERE `userId` = '%d' ORDER BY `date` DESC", $controller->getSession()->getUserId());
			$list = $db->query($sql, $db::RESULT_ITEMS);

			foreach ($list as &$session) {
				$session = new Session($session);
			}

			return [
				"count" => sizeof($list),
				"items" => $list
			];
		}
	}
