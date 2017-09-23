<?

	namespace Method\Session;

	use APIdogException;
	use Connection;
	use Controller;
	use ErrorCode;
	use Method\BaseMethod;
	use Model\Session;

	class GetByAuthKey extends BaseMethod implements \IMethod {

		protected $authKey;

		/**
		 * Some action of method
		 * @param Controller $controller
		 * @param Connection $db
		 * @return Session
		 * @throws APIdogException
		 */
		function run(Controller $controller, Connection $db) {
			$sql = sprintf("SELECT * FROM `auth` WHERE `authKey` = '%s' LIMIT 1", $this->authKey);
			$data = $db->query($sql, Connection::RESULT_ITEM);

			if (!$data) {
				throw new APIdogException(ErrorCode::AUTH_KEY_INVALID);
			}

			return new Session($data);
		}
	}