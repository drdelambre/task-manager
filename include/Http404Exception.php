<?php


class Http404Exception extends Exception {

	public function __toString() {
		return "HTTP/1.1 40404 Not Found";
	}
}

?>
