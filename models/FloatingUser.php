<?php

class FloatingUser {
    private static $_prefix = "fu";
    private static $_table = "floating_user";
    
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
	
	public static function from_id($id){
		$sql = "SELECT * FROM " . self::$_table . " WHERE " . self::$_prefix . "_id=$id";
		$rows = Database::instance()->query($sql);
		return $rows ? new self($rows[0]) : null;
	}
	
	/**
	 * Instantiate multiple objects based on the provided filters.
	 *	Available filters:
	 *		creator				- filters user by creator
	 *	Available sorts:
	 *		id					- Sorts by fu_id.
	 * @return					- An array of FloatingUser objects
	 */
	public static function all($filters = array(), $sort = "id", 
	    $sort_asc = false, $limit_start=null, $limit_count=null) {
		$sql = "SELECT " . self::$_table . ".* FROM " . self::$_table . " WHERE 1";
		foreach($filters as $filter => $values) {
			if(!is_array($values))
				$values = array($values);
			$sql .= " AND (1";
			foreach($values as $value) {
			    if(is_string($value))
			        $value = "\"".addslashes($value)."\"";
			    else if($value === null)
			        $value = "NULL";	
			        		
				switch($filter) {
				    case "creator":
				        $sql .= " AND fu_created_by_id=$value";
				        break;

				    default:
				        throw new Exception("FloatingUser::all() - Invalid filter type \"$filter\".");
				}
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
		                $sql .= "fu_id";
		                break;
    	            default:
		                throw new Exception("FloatingUser::all() - Invalid sort type \"$criteria\".");    
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
		// Run the query
//		throw new Exception($sql);
		$rows = Database::instance()->query($sql);
		if($rows) {
			$results = array();
			foreach($rows as $row)
				$results[] = new self($row);
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
				if($field[0] == '_' || $field == "id")
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
	
	/**
	 * Implements lazy instantiation of virtual properties.
	 * 	Available virtual properties:
	 *		todos			Returns all associated todos for the list
	 */	
	public function __get($var) {
		switch($var) {
			case "created_by":
				return User::from_id($this->created_by_id);
			case "info":
//				if(!array_key_exists('_info', $this)){
					$this->_info = array();
					$sql = "select usrinfo_type as name, usrinfo_text as value from user_info " .
						"where usrinfo_user_type='float' and usrinfo_user_id = " . $this->id . " and (usrinfo_owner_id = " . $this->id .
						" or usrinfo_owner_id = " . UserAuth::instance()->get_user()->id . ")";
					$res = Database::instance()->query($sql);
					foreach($res as $r)
						$this->_info[] = array($r['name'],$r['value']);
//				}
				return $this->_info;

			default: break;
		}
	}	
}


?>
