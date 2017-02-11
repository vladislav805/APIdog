<?

	$mDatabase;

	/**
	 * Работа с БД
	 */
	define("SQL_RESULT_ITEM", 1);
	define("SQL_RESULT_ITEMS", 2);
	define("SQL_RESULT_COUNT", 3);
	define("SQL_RESULT_AFFECTED", 4);
	define("SQL_RESULT_INSERTED", 5);

	/**
	 * Функция для запросов к БД
	 * @param  String $query      Запрос SQL
	 * @param  int    $resultType В каком типе возвращать результат
	 * @return Mixed              Результат, в зависимости от $resultType
	 */
	function SQLquery ($query, $resultType = SQL_RESULT_ITEM) {

		$db = getDatabase();
		$db->query("SET NAMES utf8");
		$db->set_charset("utf8");
		$result = $db->query($query);

		if (!$result) {
			return null;
		};

		switch ($resultType) {
			case SQL_RESULT_ITEM:
				return $result->fetch_assoc();

			case SQL_RESULT_ITEMS:
				$data = [];
				while ($row = $result->fetch_assoc()) {
					$data[] = $row;
				};
				return $data;

			case SQL_RESULT_COUNT:
				return (int) $result->fetch_assoc()["COUNT(*)"];

			case SQL_RESULT_INSERTED:
				return (int) $db->insert_id;

			case SQL_RESULT_AFFECTED:
				return (int) $db->affected_rows;
		};

		return null;
	};

	/**
	 * Подключение к БД
	 * @return [type] [description]
	 */
	function connectDatabase() {
		if (!defined("dbHost") || !defined("dbUser") || !defined("dbPassword") || !defined("dbDatabase")) {
			exit("db data not set");
		};

		$db = new mysqli(dbHost, dbUser, dbPassword, dbDatabase, defined("dbPort") ? dbPort : null);
		return $db;
	};

	/**
	 * Возвращает объект MySQLi для работы с БД
	 * @return MySQLi Дескриптор для работы с БД
	 */
	function getDatabase() {
		global $mDatabase;

		if (!$mDatabase) {
			return $mDatabase = connectDatabase();
		};

		return $mDatabase;
	};

	/**
	 * Закрытие коннекшена с БД
	 */
	function closeDatabase() {
		global $mDatabase;
		$mDatabase->close();
	};