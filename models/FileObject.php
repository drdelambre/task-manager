<?php

class FileObject {
    private static $_prefix = "file";
    private static $_table = "file";
    
	/**
	 * Construct from the result of a database query.
	 * @param	$row		row of user table
	 */
	public function __construct($row) {
		foreach($row as $col => $value) {
		    if(substr($col, 0, strlen(self::$_prefix) + 1) == self::$_prefix . "_") {
		        $field = substr($col, strlen(self::$_prefix) + 1);
		        $this->$field = $value;
		    }
		}
	}	
	
	/**
	 * Instantiate an object from its id.
	 * @param	$hash	Matches the file_hash field.
	 * @return			Returns a FileObject or null if it isn't found.
	 */
	public static function from_id($id) {
		$sql = "SELECT " . self::$_table . ".* FROM " . self::$_table .
			" WHERE " . self::$_prefix ."_hash=" . $id;
//		throw new Exception($sql);
		$rows = Database::instance()->query($sql);
		return $rows ? new self($rows[0]) : null;
	}
	
	/**
	 * Instantiate multiple objects based on the provided filters.
	 *	Available filters:
	 *		user				- filters todo list by involvement
	 *		active				- checks for non-empty todo lists
	 *	Available sorts:
	 *		id				- Sorts by todolist_id.
	 *		rank				- Sorts by todoorder_rank.
	 * @return					- An array of TodoList objects
	 */
	public static function all($filters = array(), $sort = "uploaded", 
	    $sort_asc = true, $limit_start=null, $limit_count=null) {
		$sql = "SELECT DISTINCT file.* FROM file
			LEFT OUTER JOIN comment_file ON cfile_file_hash = file_hash
			LEFT OUTER JOIN comment ON com_id = cfile_comment_id
			LEFT OUTER JOIN todo ON com_todo_id = todo_id
			WHERE 1";
		foreach($filters as $filter => $value) {
			$sql .= " AND (1";
			if(is_string($value))
				$value = "\"".addslashes($value)."\"";
			else if($value === null)
				$value = "NULL";	

			switch($filter) {
				case "list":
					$sql .= " AND todo_list_id=" . $value;
					break;

				default:
					throw new Exception("FileObject::all() - Invalid filter type \"{$filter}\".");
			}
			$sql .= ")";
		}
		
		if($sort) {
		    $sql .= " ORDER BY ";
		    if(!is_array($sort))
		        $sort = array($sort);
		    foreach($sort as $criteria) {
		        switch($criteria) {
		            case "hash":
		                $sql .= "file_hash";
		                break;

		            case "uploaded":
		                $sql .= "file_uploaded";
		                break;
		            
    	            default:
		                throw new Exception("FileObject::all() - Invalid sort type \"$criteria\".");    
		        }
		        $sql .= ",";
		    }
		    $sql = rtrim($sql, ",");
	    }
	    		
		if($sort_asc)
			$sql .= " ASC";
		else
			$sql .= " DESC";
			
		if(!($limit_start === null))
			$sql .= " LIMIT $limit_start, $limit_count";
			
//		throw new Exception($sql);
		// Run the query
		$rows = Database::instance()->query($sql);
		if($rows) {
			$result = array();
			foreach($rows as $row)
				$results[$row[self::$_prefix.'_hash']] = new self($row);
			return $results;
		}
		return null;		
	}

	/**
	 * Saves this object in the database. If no id value is set, a new record will be inserted,
	 * otherwise the existing record will be updated.
	 */
	public function save() {
		if($this->hash) {
			$sql = "UPDATE ".self::$_table." SET ";
			foreach($this as $field => $value) {
				if($field[0] == '_')
					continue;

				$sql .= self::$_prefix."_".$field."=";
				if($value === null)
					$sql .= "NULL";
				else if(is_string($value))
					$sql .= "\"".addslashes($value)."\"";
				else
					$sql .= $value;
				$sql .= ",";
			}
			$sql = rtrim($sql, ",");
			$sql .= " WHERE " . self::$_prefix . "_hash=" . $this->hash;
			Database::instance()->update($sql);
		} else {
			$sql = "INSERT INTO ".self::$_table."(";
			foreach($this as $field => $value) {
			    if($field[0] == '_')
			        continue;
				if($field == "rank")
					continue;
			    $sql .= self::$_prefix."_".$field.",";
			    if($value === null)
			        $sqlx .= "NULL,";
			    else if(is_string($value))
			        $sqlx .= "\"".addslashes($value)."\",";
			    else
			        $sqlx .= $value.",";
			}
			$sql = rtrim($sql, ",");
			$sqlx = rtrim($sqlx, ",");
			$sql .= ") VALUES(".$sqlx.")";
			$this->hash = Database::instance()->insert($sql);
		}
	}
	
	/**
	 * Implements lazy instantiation of virtual properties.
	 * 	Available virtual properties:
	 *		todos			Returns all associated todos for the list
	 */	
	public function __get($var) {
		switch($var) {
			case "uploaded_by":
				return User::from_id($this->uploaded_by_id);
			default: break;
		}
	}
}


?>
