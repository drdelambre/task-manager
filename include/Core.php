<?php

ob_start();

set_include_path(get_include_path() . PATH_SEPARATOR .
					PROJECT_ROOT_PATH."/include" . PATH_SEPARATOR .
					PROJECT_ROOT_PATH);

function __autoload($class) {
	if(file_exists(PROJECT_ROOT_PATH."/include/".$class.".php"))
		include_once(PROJECT_ROOT_PATH."/include/".$class.".php");
	else if(file_exists(PROJECT_ROOT_PATH."/models/".$class.".php"))
		include_once(PROJECT_ROOT_PATH."/models/".$class.".php");
	else if(file_exists(PROJECT_ROOT_PATH."/controllers/".$class.".php"))
		include_once(PROJECT_ROOT_PATH."/controllers/".$class.".php");
	else {
		ob_end_clean();
		if(DEBUG_MODE) {
			ob_end_clean();
			header("Content-type: text/plain\n");
			echo "Cannot find class '$class':\n";
			print_r(debug_backtrace());
		} else {
			header("HTTP/1.1 500 Internal Server Error");
			echo "<html>\n<body>\n<h1>HTTP/1.1 Internal Server Error</h1>\n";
			echo "<p>An error occured while processing your request. Please try again.</p>\n";
			echo "<hr><p><i>".$_SERVER['SERVER_SIGNATURE']."</i></p>\n";
			echo "</body>\n</html>\n";
		}
		exit;
	}
}


class Core {
	public static function initialize() {
		try {
			session_name(SESS_NAME);
			session_start();
		
			$route = self::find_route();
			if(!$route) {
				throw new Http404Exception();
			}

			self::invoke($route->class, $route->method, $route->params);				
				
			if(DEBUG_MODE and isset($_GET['DEBUG_DATABASE'])) {
				Database::instance()->show_debug_info();
			}
			if(DEBUG_MODE)
				self::show_php_warnings();

		} catch(Exception $e) {
		    ob_end_clean();		
			try {
				if(get_class($e) == "Http404Exception") {
					$url = '';
					$queryPos = stripos($_SERVER['REQUEST_URI'], "?");
					if($queryPos)
						$url = urldecode(substr($_SERVER['REQUEST_URI'], 0, $queryPos));
					else
						$url = urldecode($_SERVER['REQUEST_URI']);

					self::invoke("ErrorHandler", "http404", array($url));
				}
				else
					self::invoke("ErrorHandler", "uncaught_exception", array($e));
			} catch(Exception $f) {
				if(DEBUG_MODE) {
					if(!headers_sent())
						header("Content-type: text/plain");
					echo "An exception occured while trying to display an error page.\n";
					echo "The exception was:\n";
					print_r($f);
					echo "\n\nThe original exception was:\n";
					print_r($e);
					exit;
				} else {
					if(!headers_sent())
						header("HTTP/1.1 500 Internal Server Error");
					echo "<html>\n<body>\n<h1>HTTP/1.1 Internal Server Error</h1>\n";
					echo "<p>An error occured while processing your request. Please try again.</p>\n";
					echo "<hr><p><i>".$_SERVER['SERVER_SIGNATURE']."</i></p>\n";
					echo "</body>\n</html>\n";
					exit;
				}
			}
		}
	}
	
	public static function add_route($route) {
		self::$_route_table[] = $route;
	}
	
	public static function find_route(){
		$queryPos = stripos($_SERVER['REQUEST_URI'], "?");
		if($queryPos)
			$url = urldecode(substr($_SERVER['REQUEST_URI'], 0, $queryPos));
		else
			$url = urldecode($_SERVER['REQUEST_URI']);
		
		foreach(self::$_route_table as $route) {
			if($route->match($url)){
				return $route;
			}
		}
		return null;		
	}
	
	public static function invoke($class, $method, $params=array()) {
		$controller = self::load_controller($class);
		if(!$controller)
			throw new Exception("Controller '$class' not found.");
		
		$method = new ReflectionMethod($class, $method);
		if(!$method)
			throw new Exception("Controller '$class' has no method '$method'.");
		
		if(DEBUG_MODE) {
			if(count($params) < $method->getNumberOfRequiredParameters())
				throw new Exception("Not enough parameters for method '$method' in controller '$class'.");
			if(count($params) > $method->getNumberOfParameters())
				throw new Exception("Too many parameters for method '$method' in controller '$class'.");
		}		
		
		if($controller->prefix()) {
			$method->invokeArgs($controller, $params);	
			$controller->postfix();
		} else {
			if(ob_get_contents())
				ob_end_clean();
			if(headers_sent())
				throw new Exception("Cannot redirect, HTTP headers have already been sent.");

			header("Location: ".PROJECT_BASE_URL.'/');
		}
	}
	
	public static function load_controller($class) {
		if(isset(self::$_controllers[$class]))
			return self::$_controllers[$class];
			
		if(!class_exists($class, false)) {
			$path = PROJECT_ROOT_PATH."/controllers/".$class.".php";
			if(!file_exists($path))
				throw new Exception("Controller '$class' not found (looked in $path).");
			include_once($path);
		}
		
		if(isset($_SESSION['persist'][$class]))
			self::$_controllers[$class] = $_SESSION['persist'][$class]->instance();
		else
			self::$_controllers[$class] = new $class;
		
		return self::$_controllers[$class];
	}

	public function get_var($var, $default=null) {
		if(!isset($this->filter))
			$this->filter = new InputFilter();
		if(isset($_GET[$var]))
			return is_int($_GET[$var]) ? $_GET[$var] : $this->filter->process($_GET[$var]);
		return $default;
	}
	
	public function post_var($var, $default=null) {
		if(!isset($this->filter))
			$this->filter = new InputFilter();
		if(isset($_POST[$var])){
			return is_int($_POST[$var]) ? $_POST[$var] : $this->filter->process($_POST[$var]);
		}
		return $default;
	}
	
	public static function show_php_warnings() {
		if(isset($GLOBALS['php_warnings']) and count($GLOBALS['php_warnings'])) {
			echo <<<EOT
<script language="javascript" type="text/javascript"><!--
	if(confirm("Warnings occured while loading this page, would you like to view them?")) {
		var wnd = window.open();
		wnd.document.write("<HTML>\\n<BODY>\\n<h1>Warnings</h1>\\n<PRE>\\n");\n
EOT;
			foreach(self::$_php_warnings as $warning) {
				$warning[message] = addslashes($warning[message]);
				echo <<<EOT
		wnd.document.write("<hr />$warning[type] in $warning[file] ($warning[line]):<br />$warning[message]<br />\\n");\n
EOT;
			}
			echo <<<EOT
		wnd.document.write("</PRE></BODY></HTML>");
	}
--></script>
EOT;
		}	
	}
	
	public static $_route_table=array();
	public static $_php_warnings=array();
	public static $_controllers=array();
}

function error_handler($severity, $message, $filename, $lineno) {
	$error_types = array(E_NOTICE=>"NOTICE", E_WARNING=>"WARNING", E_ERROR=>"ERROR", E_PARSE=>"PARSE ERROR",
						 E_CORE_ERROR=>"CORE ERROR", E_CORE_WARNING=>"CORE WARNING", E_COMPILE_ERROR=>"COMPILE ERROR",
						 E_COMPILE_WARNING=>"COMPILE WARNING", E_USER_ERROR=>"USER ERROR", E_USER_WARNING=>"USER WARNING",
						 E_USER_NOTICE=>"USER NOTICE");
	
	if((($severity == E_WARNING or $severity == E_USER_WARNING) and !WARNINGS_AS_ERRORS) or
	   (($severity == E_NOTICE or $severity == E_USER_NOTICE) and !NOTICES_AS_ERRORS)) {
		Core::$_php_warnings[] = array(
			"type" => $error_types[$severity], "message" => $message, 
			"file" => $filename, "line" => $lineno);
		return true;
	}
    throw new ErrorException($message, 0, $severity, $filename, $lineno);
	return true;
}
set_error_handler("error_handler", E_ALL);


require_once("Routes.php");


Core::initialize();
?>
