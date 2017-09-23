<?

	namespace Method\Settings;

	use APIdogException;
	use Connection;
	use Controller;
	use Method\BaseMethod;
	use Model\Settings;

	class Get extends BaseMethod {

		/**
		 * Get constructor.
		 * @param array $request
		 */
		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * Some action of method
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 * @throws APIdogException
		 */
		public function run(Controller $controller, Connection $db) {
			$userId = $controller->getSession()->getUserId();
			$sql = sprintf("SELECT `bitmask`, `lang`, `themeId` FROM `settings` WHERE `userId` = '%d' LIMIT 1", $userId);
			$result = $db->query($sql, $db::RESULT_ITEM);

			if (!$result) {
				$result = ["bitmask" => 0, "lang" => 0, "themeId" => 0];
				$controller->perform(new Add($result));
			}

			return new Settings($result);
		}

	}