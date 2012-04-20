<?php

class TemplateResponse {

	public function TemplateResponse($tmpl, $wrap = true) {
		if(!self::$_smarty) {
			require_once(SMARTY_PATH."Smarty.class.php");
			self::$_smarty = new Smarty();
			self::$_smarty->template_dir = PROJECT_ROOT_PATH.'/templates/';
			self::$_smarty->compile_dir = PROJECT_ROOT_PATH.'/templates/compiled/';
			self::$_smarty->cache_dir = PROJECT_ROOT_PATH.'/templates/cache/';
			self::$_smarty->plugins_dir[] = PROJECT_ROOT_PATH.'/templates/plugins/';

			self::$_smarty->force_compile = true;

			if (SMARTY_DEBUGGING)
			    self::$_smarty->debugging=true;

		}

		self::$_smarty->assign("url_base", PROJECT_BASE_URL);
		self::$_smarty->assign("current_user", UserAuth::instance()->get_user());
//		self::$_smarty->assign("querystring", $_SERVER['QUERY_STRING']);
//		self::$_smarty->assign("page_title", PAGE_TITLE_BASE);
//		self::$_smarty->assign("project_title", PROJECT_TITLE);

		$this->_template = $tmpl;
		$this->_wrap = $wrap;
	}
	
	public function set($var, $value) {
		self::$_smarty->assign($var, $value);
	}
	
	public function render($dict=null) {
		if($dict) {
			foreach($dict as $var => $value)
				self::$_smarty->append($var, $value);
		}
		// use fetch instead of display so errors don't show up in the middle of HTML
        if(SMARTY_DEBUGGING){
            self::$_smarty->display($this->_template);
		} else {
			echo $this->fetch();
		}
	}
	
	public function fetch() {
		$total = self::$_smarty->fetch($this->_template);
		if($this->_wrap){
			self::$_smarty->assign("page_content", $this->_template);
			$total = self::$_smarty->fetch('wrap.tpl');
		}
		
		return $total;
	}
	
	public function get_template_vars($value) {
		return self::$_smarty->get_template_vars($value);
	}
	
	public function exists(){
		if(self::$_smarty->template_exists($this->_template))
			return true;
		return false;
	}

	private $_template=null;
	private $_wrap=null;
	private static $_smarty=null;
}

?>
