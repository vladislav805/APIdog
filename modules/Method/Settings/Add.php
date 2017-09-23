<?

	namespace Method\Settings;

	use APIdogException;
	use Connection;
	use Controller;
	use ErrorCode;
	use Method\BaseMethod;

	class Add extends BaseMethod {

		protected $userId;
		protected $bitmask;
		protected $lang;

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

			$sql = sprintf("INSERT INTO `settings` (`userId`, `bitmask`, `lang`, `notification`) VALUES ('%d', '%d', '%d', '%d')", $controller->getSession()->getUserId(), $this->bitmask, $this->lang, 0);

			$result = $db->query($sql, $db::RESULT_INSERTED_ID);

			return (boolean) $result;

		}
	}