<?

	interface IMethod {

		/**
		 * Some action of method
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 */
		function run(Controller $controller, Connection $db);

	}