<?

	namespace Method\Ad;

	use Connection;
	use Controller;
	use Method\BaseMethod;
	use Model\Ad;

	class GetWeb extends BaseMethod {

		/** @var boolean */
		protected $needShuffle = true;

		/** @var int */
		protected $count;

		/**
		 * Get constructor.
		 * @param array $request
		 */
		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 */
		public function run(Controller $controller, Connection $db) {
			$sql = "SELECT * FROM `ad` WHERE `active` = 1 AND `type` IN (1, 2) AND `dateStart` < UNIX_TIMESTAMP(NOW()) AND `dateEnd` > UNIX_TIMESTAMP(NOW())";
			$available = $db->query($sql, $db::RESULT_ITEMS);


			$sql = "SELECT * FROM `ad` WHERE `active` = 1 AND `type` = 10 AND `dateStart` < UNIX_TIMESTAMP(NOW()) AND `dateEnd` > UNIX_TIMESTAMP(NOW())";
			$feed = $db->query($sql, $db::RESULT_ITEMS);

			if ($this->needShuffle) {
				shuffle($available);
			};


			return (object) [
				"menu" => $this->parse(array_slice($available, 0, $this->count)),
				"feed" => $this->parse($feed)
			];
		}

		public static function parse($items) {
			foreach ($items as &$item) {
				$item = new Ad($item);
			}
			return $items;
		}
	}