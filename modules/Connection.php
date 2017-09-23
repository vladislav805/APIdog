<?

	class Connection {

		const RESULT_ITEM = 1;
		const RESULT_ITEMS = 2;
		const RESULT_INSERTED_ID = 3;
		const RESULT_AFFECTED = 4;
		const RESULT_COUNT = 5;

		/** @var mysqli */
		private $mConnect;

		/**
		 * Connection constructor.
		 * @param string $host
		 * @param string $user
		 * @param string $password
		 * @param string $database
		 * @param int    $port
		 * @throws APIdogException
		 */
		public function __construct($host, $user, $password, $database, $port = 0) {
			$this->mConnect = $port ? new mysqli($host, $user, $password, $database, $port) : new mysqli($host, $user, $password, $database);

			if ($this->mConnect->error) {
				throw new APIdogException(ErrorCode::INTERNAL_DATABASE_ERROR);
			}

			$this->mConnect->query("SET NAMES utf8");
		}

		/**
		 * Execute SQL-query
		 * @param string $sql
		 * @param int    $type
		 * @return mixed
		 */
		public function query($sql, $type) {
			$response = $this->mConnect->query($sql);

			switch ($type) {
				case self::RESULT_ITEM:
					return $response->fetch_assoc();

				case self::RESULT_ITEMS:
					$result = [];
					while ($i = $response->fetch_assoc()) {
						$result[] = $i;
					};
					return $result;

				case self::RESULT_COUNT:
					return (int) $response->fetch_assoc()["COUNT(*)"];

				case self::RESULT_INSERTED_ID:
					return $this->mConnect->insert_id;

				case self::RESULT_AFFECTED:
					return $this->mConnect->affected_rows;

				default:
					return $response;
			}
		}

		public function escape(&$string) {
			$this->mConnect->real_escape_string($string);
		}

	}