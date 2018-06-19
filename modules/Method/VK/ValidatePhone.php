<?

	namespace Method\VK;

	use Connection;
	use Controller;
	use Method\BaseMethod;
	use Tools\VKRequest;

	class ValidatePhone extends BaseMethod {

		/** @var string */
		protected $validationId;

		/**
		 * ValidatePhone constructor.
		 * @param $request
		 */
		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * Single proxy-request
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 */
		public function run(Controller $controller, Connection $db) {
			$data = new VKRequest("auth.validatePhone", [
				"sid" => $this->validationId,
				"v" => 5.58
			]);

			return $data->send();
		}
	}