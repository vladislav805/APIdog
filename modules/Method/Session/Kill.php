<?

	namespace Method\Session;

	use APIdogException;
	use Connection;
	use Controller;
	use ErrorCode;
	use Method\BaseMethod;

	class Kill extends BaseMethod {

		protected $authId = null;

		/**
		 * Kill constructor.
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
		function run(Controller $controller, Connection $db) {

			if (!$this->authId) {
				throw new APIdogException(ErrorCode::INVALID_PARAM);
			}

			$session = $controller->getSession();
			$sql = sprintf("DELETE FROM `auth` WHERE `userId` = '%d' AND `authId` = '%d' LIMIT 1", $session->getUserId(), $this->authId);
			$ok = $db->query($sql, $db::RESULT_AFFECTED);

			if (!$ok) {
				throw new APIdogException(ErrorCode::AUTH_KEY_INVALID);
			}

			return $ok;
		}
	}