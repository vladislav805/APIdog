<?

	namespace Method\Authorize;

	use Connection;
	use Controller;
	use Method\BaseMethod;

	class CreateSalt extends BaseMethod {

		/** @var string */
		protected $accessToken;

		/** @var int */
		protected $userId;

		/**
		 * CreateSalt constructor.
		 * @param $request
		 */
		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * @param Controller $controller
		 * @param Connection $db
		 * @return string
		 */
		function run(Controller $controller, Connection $db) {
			return hash_hmac("sha256", $this->accessToken . $this->userId, AUTH_APIDOG_SALT);
		}
	}