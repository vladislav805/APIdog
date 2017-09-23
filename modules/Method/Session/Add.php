<?

	namespace Method\Session;

	use Connection;
	use Controller;
	use Method\BaseMethod;
	use Model\VKSession;

	class Add extends BaseMethod {

		/** @var VKSession */
		protected $vk;

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
		 * @return mixed
		 */
		public function run(Controller $controller, Connection $db) {
			$authKey = hash_hmac("sha256", time() . $this->vk->getUserId(), AUTH_APIDOG_SALT);
			$sql = sprintf("INSERT INTO `auth` (`userId`, `date`, `authKey`, `applicationId`) VALUES ('%d', UNIX_TIMESTAMP(NOW()), '%s','%d')", $this->vk->getUserId(), $authKey, $this->vk->getApplicationId());
			$authId = $db->query($sql, $db::RESULT_AFFECTED);

			return $controller->perform(new GetByAuthKey(["authKey" => $authKey]));
		}
	}