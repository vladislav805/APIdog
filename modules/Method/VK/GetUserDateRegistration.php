<?

	namespace Method\VK;

	use APIdogException;
	use Connection;
	use Controller;
	use DateTime;
	use ErrorCode;
	use Method\BaseMethod;

	class GetUserDateRegistration extends BaseMethod {

		/** @var string */
		protected $userId;

		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 * @throws APIdogException
		 */
		public function run(Controller $controller, Connection $db) {

			if ($this->userId <= 0) {
				throw new APIdogException(ErrorCode::INVALID_PARAM);
			}

			$request = file_get_contents("http://vk.com/foaf.php?id=" . $this->userId);

			$xml = xml_parser_create();
			xml_parse_into_struct($xml, $request, $values, $indexes);
			xml_parser_free($xml);

			if (!isset($indexes["YA:CREATED"])) {
				throw new APIdogException(ErrorCode::INVALID_PARAM);
			}

			$dateCreated = strToTime($values[$indexes["YA:CREATED"][0]]["attributes"]["DC:DATE"]);


			$days = $this->difference($dateCreated);

			$info = [
				"created" => $dateCreated,
				"interval" => time() - $dateCreated,
				"days" => $days
			];
			return $info;
		}

		private function difference($date) {
			$now = new DateTime(date("Y-m-d", time()));
			$was = new DateTime(date("Y-m-d", $date));

			$interval = $now->diff($was);

			return $interval->days;
		}
	}