<?

	namespace Method\Settings;

	use APIdogException;
	use Connection;
	use Controller;
	use ErrorCode;
	use Method\BaseMethod;

	class Set extends BaseMethod {

		/** @var int */
		protected $bitmask;

		/** @var int */
		protected $language;

		/**
		 * Add constructor.
		 * @param $request
		 */
		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * Some action of method
		 * @param Controller $controller
		 * @param Connection $db
		 * @return boolean
		 * @throws APIdogException
		 */
		public function run(Controller $controller, Connection $db) {
			if (!$controller->getSession()->isAuthorized()) {
				throw new APIdogException(ErrorCode::AUTH_KEY_INVALID);
			}


			$sql = sprintf("UPDATE `settings` SET `bitmask` = '%d', `lang` = '%d', `notification` = '%d' WHERE `userId` = '%d' LIMIT 1", $this->bitmask, $this->language, 0, $controller->getSession()->getUserId());

			$result = $db->query($sql, $db::RESULT_AFFECTED);

			return (boolean) $result;

		}
	}