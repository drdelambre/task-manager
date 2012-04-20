<?php

/**
 * User-friendly exceptions.
 *
 * This class is for exceptions which should be displayed to the user
 * even in production mode.
 */

class UserException extends Exception {

	public function __toString() {
		return $this->getMessage();
	}
}

?>
