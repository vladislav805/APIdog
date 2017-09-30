<?
	/*************************
	 *                       *
	 *    DEPRECATED CODE    *
	 *                       *
	 *************************/

	/****************
	 * APIdog APIv2 *
	 ****************
	 *  14.03.2015  *
	 ****************/

	/**
	 * @param int $userId
	 * @return boolean
	 */
	function getAdmin($userId) {
		$agents = [
			23048942	=> 1, // Veluga
			203384908	=> 1, // Tester
			3869934		=> 1, // Ivanova
			184870404	=> 3, // Karpovich
			202984498	=> 3, // Karpovich (fake, Anton)
			19027419	=> 7  // Tkachuk
		][$userId];
		return ($agents ? $agents : false);
	}