<?php


class Http403Exception extends Exception {

	public function __toString() {
		return "HTTP/1.1 403 Forbidden";
	}
}

?>
