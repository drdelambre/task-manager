<?php

class ErrorHandler extends Controller {
	public function prefix() {
		// Erase any buffered output so far so we can print an error message
		ob_end_clean();
		return true;
	}
	
	/**
	* Displays an exception.
	* @param	$exception		String to be displayed to the user.
	*/
	public function uncaught_exception($exception) {
		header("Content-type: text/plain");
		echo "An exception occured:\n";
		print($exception);
	}
	
	/**
	* Displays a 404 page when a page isn't found.
	*/
	public function http404($url) {
		header("HTTP/1.1 404 Not Found");
		$template = new TemplateResponse('404.tpl', false);
		$template->set('studs', Database::instance()->query("select name from 404studs limit 100"));
		$template->set('url', $url);
		$template->render();
	}

	/**
	* Displays a 403 page when a page isn't found.
	*/
	public function http403() {
		header("HTTP/1.1 403 Forbidden");
		$template = new TemplateResponse('403.tpl', false);
		$template->render();
	}
}

?>
