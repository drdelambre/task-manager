<?php

class Todolist {
    private static $_prefix = "list";
    private static $_table = "todolist";
    
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
	 * @param	$id		Matches the usr_id field.
	 * @return			Returns a User object or null if it isn't found.
	 */
	public static function from_id($id) {
		$sql = "SELECT " . self::$_table . ".*, usrlist_rank as " . self::$_prefix . "_rank FROM " . self::$_table .
			" LEFT JOIN user_list ON usrlist_list_id = {$id} WHERE " . self::$_prefix .
			"_id=$id AND usrlist_user_id = " . UserAuth::instance()->get_user()->id;
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
	public static function all($filters = array(), $sort = "rank", 
	    $sort_asc = true, $limit_start=null, $limit_count=null) {
		$sql = "SELECT DISTINCT todolist.*, usrlist_rank AS list_rank, usrlist_status AS list_status FROM todolist
			LEFT OUTER JOIN user_list ON usrlist_list_id = list_id
			WHERE 1";
		foreach($filters as $filter => $value) {
			$sql .= " AND (1";
			if(is_string($value))
				$value = "\"".addslashes($value)."\"";
			else if($value === null)
				$value = "NULL";	

			switch($filter) {
				case "user":
					$sql .= " AND usrlist_user_id=$value";
					break;
				case "status":
					$sql .= " AND usrlist_status=" . $value;
					break;

				default:
					throw new Exception("Todolist::all() - Invalid filter type \"{$filter}\".");
			}
			$sql .= ")";
		}
		
		if($sort) {
		    $sql .= " ORDER BY ";
		    if(!is_array($sort))
		        $sort = array($sort);
		    foreach($sort as $criteria) {
		        switch($criteria) {
		            case "id":
		                $sql .= "list_id";
		                break;

		            case "rank":
		                $sql .= "list_rank";
		                break;
		            
		            case "status":
		                $sql .= "list_status";
		                break;
		            
	    	            default:
		                throw new Exception("Todolist::all() - Invalid sort type \"$criteria\".");    
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
				$results[$row[self::$_prefix.'_id']] = new self($row);
			return $results;
		}
		return null;		
	}

	/**
	 * Saves this object in the database. If no id value is set, a new record will be inserted,
	 * otherwise the existing record will be updated.
	 */
	public function save() {
		if($this->id) {
			$sql = "UPDATE ".self::$_table." SET ";
			foreach($this as $field => $value) {
				if($field[0] == '_')
					continue;
				if($field == "rank" || $field == "status")
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
			$sql .= " WHERE " . self::$_prefix . "_id=" . $this->id;
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
			$this->id = Database::instance()->insert($sql);
		}
	}
	
	public function completed_todos($start=0,$limit=20,$order="asc"){
		if($order == 'asc')
			return TodoObject::all(array("list"=>$this->id, "active"=>false),"closed",true,$start,$limit);
		return array_reverse(TodoObject::all(array("list"=>$this->id, "active"=>false),"closed",false,$start,$limit));
	}

	/**
	 * Implements lazy instantiation of virtual properties.
	 * 	Available virtual properties:
	 *		todos			Returns all associated todos for the list
	 */	
	public function __get($var) {
		switch($var) {
			case "todos":
				if(!array_key_exists("_todos", $this))
					$this->_todos = TodoObject::all(array("list"=>$this->id), "rank");
				return $this->_todos;
			case "active_todos":
				return TodoObject::all(array("list"=>$this->id, "active"=>true), "rank");
			case "completed_todos":
				return TodoObject::all(array("list"=>$this->id, "active"=>false), "closed");
			case "files":
				return FileObject::all(array("list"=>$this->id));
			default: break;
		}
	}
}


?>
