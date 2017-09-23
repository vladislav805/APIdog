<?
	namespace Method;

	use IMethod;

	abstract class BaseMethod implements IMethod {

		public function __construct($request) {
			if (is_array($request)) {
				foreach ($request as $key => $value) {
					if (property_exists($this, $key)) {
						$this->{$key} = is_string($value) ? safeString($value) : $value;
					}
				}
			}
		}

	}