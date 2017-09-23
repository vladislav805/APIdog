<?

	namespace Method\Internal;

	use Connection;
	use Controller;
	use Method\BaseMethod;

	class CollectError extends BaseMethod {

		/** @var string */
		protected $data;

		/**
		 * CollectError constructor.
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

			$db->escape($this->data);

			$db->query(sprintf("INSERT INTO `telemetry` (`data`) VALUES ('%s')", $this->data), $db::RESULT_INSERTED_ID);

			return true;
		}
	}