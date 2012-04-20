<?php

/**
 * Provides database access.
 * 
 * The Database object is a wrapper for database access. It provides
 * a layer of abstraction that increases the convenience of common
 * database operations. It implements the singleton pattern.
 */
class Database {
	
	private function Database() {
		// Initialize the singleton
		self::$_instance = $this;
		
		// Attempt to connect using the settings from Config.php
		$this->_db = new mysqli(DATABASE_HOSTNAME, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_NAME);
		if(mysqli_connect_errno())
			throw new Exception("Failed to connect to the database: ".mysqli_connect_error());
	}

	public static function &instance() {
		if(!self::$_instance)
			self::$_instance = new Database();
		return self::$_instance;
	}
	
	public function cleanString($string) { return $this->_db->real_escape_string($string); }
	
	public function query($sql) {
		$result = $this->_query($sql);
		
		$rows = array();
		while($row = $result->fetch_array(MYSQLI_ASSOC)) {
			foreach($row as $col => $val) {
				if(is_string($val))
					$row[$col] = stripslashes($val);
			}
			$rows[] = $row;
		}
		return $rows;
	}
	
	public function update($sql) {
		$result = $this->_query($sql);
		return $this->_db->affected_rows;
	}
	
	public function insert($sql) {
		$result = $this->_query($sql);
		return $this->_db->insert_id;
	}
	
	public function execute($sql) {
		$this->_query($sql);
	}
	
	public function show_debug_info() {
		if($this->_history) {
			echo <<<EOT
<script language="javascript" type="text/javascript"><!--
	if(confirm("View database queries?")) {
		var wnd = window.open();
		wnd.document.write("<HTML>\\n<BODY>\\n<h1>Warnings</h1>\\n<PRE>\\n");\n
EOT;
			foreach($this->_history as $query) {
				echo "wnd.document.write(\"<hr>\");";// . str_replace("\t", "\\t", str_replace("\n", "\\n", addslashes($query['sql']))) . "\");\n";
				foreach(explode("<\/>", wordwrap(str_replace("\n", " ", str_replace("\t", " ", str_replace("\r\n", " ", $query['sql']))),100,"<\/>")) as $outline)
					echo "wnd.document.write(\"" . addslashes($outline) . "\");\n";
				echo "wnd.document.write(\"<br>" . addslashes($query[info]) . "<br>\\n\");\n";
			}
			echo <<<EOT
		wnd.document.write("</PRE></BODY></HTML>");
	}
--></script>
EOT;
		}		
	}
	
	private function _query($sql) {
		$result = $this->_db->query($sql);
		if(!$result)
			throw new Exception("Database query failed: ".$this->_db->error."\nSQL: $sql");
		
		if(DEBUG_MODE)
			$this->_history[] = array("sql" => $sql, "info" => $this->_db->info);
		return $result;
	}
	
	private static $_instance=null;
	private $_db;
	public $_history=null;
}
?>
