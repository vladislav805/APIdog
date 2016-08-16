<?

	/**
	 * Работа с платными услугами
	 */

	/**
	 * Платная услуга
	 */
	class APIdogProduct {

		public $productId;
		public $amount;
		public $title;
		public $description;
		public $period;
		public $analog;

		public function __construct ($p) {
			$this->productId = (int) $p["productId"];
			$this->amount = (int) $p["amount"];
			$this->title = $p["title"];
			$this->description = $p["description"];
			$this->period = (int) $p["period"];
			$this->analog = array_map("intval", explode(",", $p["analog"]));
		}

		/**
		 * Вычисляет конечную дату работы услуги
		 * @return int Дата в unixtime
		 */
		public function getUntilDate () {
			return $this->period ? time() + $this->getPeriodTime() : 0;
		}

		/**
		 * Вычисляет и возвращает время периода действия услуги
		 * @return int Время в секундах
		 */
		public function getPeriodTime () {
			$day = 24 * 60 * 60;
			return [
				0,
				$day,
				$day * 7,
				$day * 14,
				$day * 30,
				$day * 30 * 6,
				$day * 365
			][$this->period];
		}

		/**
		 * Возвращает приобретенный аналог этого продукта, если такой имеется
		 * @param  array<int> $payed Массив с приобритенными продуктами
		 * @return int               Идентификатор приобритенного продукта или false
		 */
		public function getAnalogBought ($payed) {
			foreach ($payed as $item) {
				if (in_array($item->productId, $this->analog)) {
					return $item->productId;
				};
			};
			return false;
		}

		/**
		 * Сырой массив из БД в объекты
		 * @param  array<array> $items Массив из БД
		 * @return array<object>       Массив объектов
		 */
		static function parse ($items) {
			foreach ($items as $i => $item) {
				$items[$i] = new APIdogProduct($item);
			};
			return $items;
		}

		/**
		 * Возвращает все услуги
		 * @return array<APIdogProduct> Массив с доступными продуктами
		 */
		static function getAll () {
			return APIdogProduct::parse(SQLquery("SELECT * FROM `products` WHERE `released` = 1 ORDER BY `productId` DESC", SQL_RESULT_ITEMS));
		}

		/**
		 * Возвращает информцию об услуге по её идентификатору
		 * @param  int $productId Идентификатор услуги
		 * @return APIdogProduct  Информация об услуге
		 */
		static function getProductById ($productId) {
			return new APIdogProduct(SQLquery("SELECT * FROM `products` WHERE `productId` = '" .$productId. "'", SQL_RESULT_ITEM));
		}

		/**
		 * Возвращает заказы пользователя
		 * @return array<APIdogOrder> Массив с заказами
		 */
		static function getPayed () {
			$now = time();
			$payed = SQLquery("SELECT * FROM `paid` WHERE `userId` = '" . userId . "' AND `isActive` = 1 AND (`untilDate` = 0 OR `untilDate` > " . $now . ")", SQL_RESULT_ITEMS);

			$payedItems = [];

			foreach ($payed as $item) {
				$payedItems[$item["productId"]] = new APIdogOrder($item);
			};

			return $payedItems;
		}

		/**
		 * Проверяет, активны ли заказы у пользователя
		 * @param  array<int>  $ids Список идентификаторов заказов
		 * @return array<boolean>   Ассоциативный массив с результатами
		 */
		static function isPayed($ids) {
			$now = time();
			$payed = SQLquery("SELECT `productId` FROM `paid` WHERE `userId` = '" . userId . "' AND `isActive` = 1 AND (`untilDate` = 0 OR `untilDate` > " . $now . ")", SQL_RESULT_ITEMS);

			foreach ($payed as $item) {
				$result[] = $item["productId"];
			};

			foreach ($ids as $id) {
				$data[$id] = !!$result[$id];
			}

			return $data;
		}
	};

	/**
	 * Заказ услуг
	 */
	class APIdogOrder {

		public $orderId;
		public $productId;
		public $userId;
		public $date;
		public $untilDate;
		public $amount;
		public $isActive;

		public function __construct ($p) {
			foreach ($p as $a => $b) {
				$this->$a = is_numeric($b) ? (int) $b : $b;
			};
		}

		/**
		 * Создание заказа
		 * @param  APIdogProduct $product Услуга, которую нужно приобрести
		 * @return int                    Идентификатор заказа
		 */
		static function create (APIdogProduct $product) {
			$orderId = SQLquery("INSERT INTO `paid` (`productId`, `userId`, `date`, `untilDate`, `amount`, `isActive`) VALUES ('" . $product->productId . "','" . userId . "','" . time() . "', '" . $product->getUntilDate() . "','" . $product->amount . "',0)", SQL_RESULT_INSERTED);
			return $orderId;
		}

		/**
		 * Возвращает информацию о заказе по её идентификатору
		 * @param  int $orderId Идентификатор заказа
		 * @return APIdogOrder  Заказ
		 */
		static function getOrderById ($orderId) {
			return new APIdogOrder(SQLquery("SELECT * FROM `paid` WHERE `orderId` = '" . ((int) $orderId) . "' LIMIT 1"));
		}

		/**
		 * Проверяет, корректно ли оплачен заказ
		 * @param  int  $orderId    Идентификатор заказа
		 * @param  int  $realAmount Стоимость услуги
		 * @return boolean          true, если всё верно
		 */
		static function isValidPayment ($orderId, $realAmount) {
			$order = APIdogOrder::getOrderById($orderId);
			$product = APIdogProduct::getProductById($order->productId);

			return $order->amount >= $product->amount && $product->amount <= $realAmount;
		}

		/**
		 * Подтверждение оплаты заказа
		 * @param  int $orderId Идентификатор заказа
		 * @param  int $amount  Стоимость
		 * @return boolean
		 */
		static function confirm ($orderId, $amount) {
			$orderId = (int) $orderId;

			$isValid = APIdogOrder::isValidPayment($orderId, $amount);

			$result = true;

			if ($isValid) {
				$result = SQLquery("UPDATE `paid` SET `isActive` = 1 WHERE `orderId` = '" . $orderId . "'", SQL_RESULT_AFFECTED);
			};

			return $result;
		}

	}