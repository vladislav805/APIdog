<?

	namespace Method\Internal;

	use Connection;
	use Controller;
	use Method\BaseMethod;

	class Test extends BaseMethod {

		/**
		 * Test constructor.
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
		 */
		function run(Controller $controller, Connection $db) {
			return $_REQUEST;
		}
	}