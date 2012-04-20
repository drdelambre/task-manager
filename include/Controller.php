<?php

class Controller {
	public function __construct() {
	}
	
	public function prefix() {
		return true;
	}
	
	public function postfix() {
	}
	
	public function redirect($target, $type=302) {
		// If $target begins with http:// don't touch it -
		// otherwise, prepend the project base url
		if(!(strpos($target, "http://") === 0))
			$target = PROJECT_BASE_URL.$target;
			
		if(ob_get_contents())
			ob_end_clean();
		if(headers_sent())
			throw new Exception("Cannot redirect, HTTP headers have already been sent.");

		if($type==301)
			header("HTTP/1.1 301 Moved Permanently");
		else if($type==303)
			header("HTTP/1.1 303 See Other");
		else if($type==307)
			header("HTTP/1.1 307 Temporary Redirect");
		else
			header("HTTP/1.1 302 Found");
		header("Location: ".$target);
	}

	public function declare_persistant() {
		$this->_make_persistant();
		$this->_persistant=true;
	}

	public function end_persistant() {
		$class = get_class($this);
		if(isset($_SESSION['persist'][$class]))
			unset($_SESSION['persist'][$class]);
		$this->_persistant=false;
	}
	
	public function persist_once() {
		$this->_make_persistant();
	}
	
	public function __wakeup() {
		// If only temporararily persistant (from persist_once()) erase
		// the proxy from the session
		if(!$this->_persistant)
			$this->end_persistant();
	}
	
	public function __destruct() {
		$class = get_class($this);
		if(isset($_SESSION['persist'][$class]))
			$_SESSION['persist'][$class]->save();
	}
	
	private function _make_persistant() {
		$class = get_class($this);
		$_SESSION['persist'][$class] = new ControllerProxy($class, $this);
	}
	
	private $_persistant;
}
 
?>
