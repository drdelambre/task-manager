<?php

class Route {
	public function __construct($url, $class, $method, $params=array()) {
		// Extract wildcards and captures from the URL
		$basepath = addcslashes(PROJECT_BASE_URL, '/');
		$this->url = "/^".$basepath.preg_replace("/\{\*\}/", "([a-zA-Z0-9_\-\ ]*?)", 
						preg_replace("/\{\@}/", "([0-9_\-]+)", 
						preg_replace("/\{[x]\}/", ".*",
						addcslashes($url, "\\/.()+?[]|^$")), -1, $param_count))."$/";
		
		if($param_count) {
			$this->params = array_merge(array_fill(0, $param_count, null), $params);
		} else {
			$this->params = $params;
		}

		$this->method = $method;
		$this->class = $class;
	}
		
	public function match($url) {
		$vars = array();
		if(preg_match_all($this->url, $url, $vars)) {
			for($i=1; $i<count($vars); $i++) {
				$this->params[$i-1] = $vars[$i][0];
			}
			return true;
		}
		return false;
	}

	// Public members
	public $url;
	public $class;
	public $method;	
	public $params;
}

class StaticPageRoute extends Route {
	public function __construct($url, $template) {
		parent::__construct($url, "StaticPage", "display", array($template));
	}
}

class AutoRedirectRoute extends Route {
	public function __construct($url, $target) {
		parent::__construct($url, "StaticPage", "auto_redirect", array($target));
	}
}

?>
