<?php

class ControllerProxy {

	public function ControllerProxy($class, $instance) {
		$this->_class = $class;
		$this->_instance = $instance;
	}
	

	public function &instance() {
		if(!$this->_saved) {
			//throw new Exception("Saved instance of '$this->_class' not found.");
			$this->_instance = new $this->_class;
			return $this->_instance;
		}
			
		if(!class_exists($this->_class, false))
			throw new Exception("Cannot unserialize instance of '$this->_class' because the class is not loaded.");
		
		$this->_instance = unserialize(base64_decode($this->_saved));
		return $this->_instance;
	}
	
	public function save() {
		if(is_object($this->_instance))
			$this->_saved = serialize($this->_instance);
		else
			$this->_saved = strval($this->_instance);
		$this->_saved = base64_encode($this->_saved);
	}
	
	public function __sleep() {
		return array("_saved", "_class");
	}
	
	private $_class=null;
	private $_saved=null;
	private $_instance=null;
}

?>
