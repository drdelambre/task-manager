<?php
class Model {
	public static $_table;
	public static $_prefix;

	public function __construct($row) {
		foreach($row as $col => $value) {
		    if(substr($col, 0, strlen(static::$_prefix) + 1) == static::$_prefix . "_") {
		        $field = substr($col, strlen(static::$_prefix) + 1);
		        $this->$field = $value;
		    }
		}
	}	

	public static function from_id($id){
		$sql = "SELECT * FROM " . static::$_table . " WHERE " . static::$_prefix . "_id=" . $id;
		return new self(current(Database::instance()->query($sql)));
	}

	public static function save() {
		if($this->id) {
			$sql = "UPDATE ".static::$_table." SET ";
			foreach($this as $field => $value) {
			    if($field[0] == '_')
			        continue;
			    $sql .= static::$_prefix . $field . "=";
			    if($value === null)
			        $sql .= "NULL";
			    else if(is_string($value))
			        $sql .= "\"" . addslashes($value) . "\"";
			    else
			        $sql .= $value;
			    $sql .= ",";
			}
			$sql = rtrim($sql, ",");
			$sql .= " WHERE " . static::$_prefix . "id=" . $this->id;
			Database::instance()->update($sql);
		} else {
			$sql = "INSERT INTO ".static::$_table."(";
			foreach($this as $field => $value) {
			    if($field[0] == '_')
			        continue;
			    $sql .= static::$_prefix . $field . ",";
			    if($value === null)
			        $sqlx .= "NULL,";
			    else if(is_string($value))
			        $sqlx .= "\"" . addslashes($value) . "\",";
			    else
			        $sqlx .= $value . ",";
			}
			$sql = rtrim($sql, ",");
			$sqlx = rtrim($sqlx, ",");
			$sql .= ") VALUES(" . $sqlx . ")";
			$this->id = Database::instance()->insert($sql);
		}
	}
}
?>
