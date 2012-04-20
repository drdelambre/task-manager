<?php

class TodoObject {
    private static $_prefix = "todo";
    private static $_table = "todo";
    
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
		$user = UserAuth::instance()->get_user()->id;
		$sql = <<<EOT
SELECT DISTINCT todo.*, to_rank as todo_rank
	FROM todo
		LEFT JOIN todo_order ON to_todo_id = todo_id
	WHERE todo_id={$id}
		AND (to_user_id IS NULL OR to_user_id = {$user});
EOT;
		$rows = Database::instance()->query($sql);
		return $rows ? new self($rows[0]) : null;
	}
	
	/**
	 * Instantiate multiple objects based on the provided filters.
	 *	Available filters:
	 *		list				- filters todos by their list
	 *	Available sorts:
	 *		id				- Sorts by todolist_id.
	 *		rank				- Sorts by todoorder_rank.
	 * @return					- An array of TodoList objects
	 */
	public static function all($filters = array(), $sort = "id", 
	    $sort_asc = true, $limit_start=null, $limit_count=null) {
		$sql = "SELECT DISTINCT todo.*, to_rank AS todo_rank FROM todo
			LEFT OUTER JOIN todo_order ON to_todo_id = todo_id
			WHERE 1";
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
				    case "list":
				        $sql .= " AND todo_list_id=$value";
				        break;

				    case "active":
				        $sql .= " AND todo_completed " . ($value?"IS NULL OR todo_completed=0":"IS NOT NULL OR todo_completed != 0");
				        break;

				    default:
				        throw new Exception("TodoObject::all() - Invalid filter type \"$filter\".");
				}
			}
			$sql .= ")";
		}
		$sql .= " AND todo_deleted != 1 AND (to_user_id IS NULL OR to_user_id = " . UserAuth::instance()->get_user()->id . ")";

		if($sort) {
		    $sql .= " ORDER BY ";
		    if(!is_array($sort))
		        $sort = array($sort);
		    foreach($sort as $criteria) {
		        switch($criteria) {
		            case "id":
		                $sql .= "todo_id";
		                break;

		            case "rank":
		                $sql .= "todo_rank";
		                break;

		            case "closed":
		                $sql .= "todo_completed";
		                break;

	    	            default:
		                throw new Exception("TodoObject::all() - Invalid sort type \"$criteria\".");    
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
				if($field[0] == '_' || $field == "rank" || $field == "id")
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
				if($field[0] == '_' || $field == "rank")
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
	
	public function comments($start=0,$limit=5,$order="asc"){
		if($order == 'asc')
			return TodoComment::all(array("todo"=>$this->id),"created",true,$start,$limit);
		return array_reverse(TodoComment::all(array("todo"=>$this->id),"created",false,$start,$limit));
	}

	/**
	 * Implements lazy instantiation of virtual properties.
	 * 	Available virtual properties:
	 *		todos			Returns all associated todos for the list
	 */	
	public function __get($var) {
		switch($var) {
			case "completed_short":
				$date = new DateTime($this->completed);
				return $date->format('Md');
			case "list":
				if(!array_key_exists('_list', $this))
					$this->_list = Todolist::from_id($this->list_id);
				return $this->_list;
			case "created_by":
				if(!array_key_exists('_created', $this))
					$this->_created = User::from_id($this->created_by_id);
				return $this->_created;
			case "completed_by":
				if(!array_key_exists('_completed', $this))
					$this->_completed = User::from_id($this->completed_by_id);
				return $this->_completed;
			case "comments":
				if(!array_key_exists('_comments', $this))
					$this->_comments = array_reverse(TodoComment::all(array('todo' => $this->id)));
				return $this->_comments;

			default: break;
		}
	}	
}


?>
