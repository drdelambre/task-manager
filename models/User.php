<?php

class User {
    private static $_prefix = "usr";
    private static $_table = "user";
    
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
		$sql = "SELECT * FROM " . self::$_table . " WHERE " . self::$_prefix . "_id=$id";
		$rows = Database::instance()->query($sql);
		return $rows ? new self($rows[0]) : null;
	}
	
	/**
	 * Instantiate multiple objects based on the provided filters.
	 *	Available filters:
	 *		email				- Matches the usr_email field.
	 *		password			- Matches the usr_password field.
	 *	Available sorts:
	 *		id				- Sorts by usr_id.
	 * @return					- An array of User objects
	 */
	public static function all($filters = array(), $sort = "id", 
	    $sort_asc = true, $limit_start=null, $limit_count=null) {
		$sql = "SELECT * FROM user WHERE 1 ";
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
				    case "email":
				        $sql .= " AND usr_email=$value";
				        break;

				    case "name":
				        $sql .= " AND usr_name=$value";
				        break;

				    case "password":
				        $sql .= " AND usr_password=$value";
				        break;

				    case "exclude":
				        $sql .= " AND usr_id!=$value";
				        break;

				    default:
				        throw new Exception("User::all() - Invalid filter type \"$filter\".");
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
		                $sql .= "usr_id";
		                break;
		            
    	            default:
		                throw new Exception("User::all() - Invalid sort type \"$criteria\".");    
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
		$rows = Database::instance()->query($sql);
		if($rows) {
			$results = array();
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
	 *		full_name			Returns user's full name
	 */	
	public function __get($var) {
		switch($var) {
			case "calendars":
//				if(!array_key_exists('_calendars', $this))
					$this->_calendars = Calendar::all(array('user'=>$this->id));
//				throw new Exception(print_r($this->_calendars, true));
				return $this->_calendars;
			case "lists":
				if(!array_key_exists('_lists', $this))
					$this->_lists = Todolist::all(array('user'=>$this->id, 'status'=>'active'));
				return $this->_lists;
			case "pending_lists":
				if(!array_key_exists('_plists', $this))
					$this->_plists = Todolist::all(array('user'=>$this->id, 'status'=>'pending'));
				return $this->_plists;
			case "file_lists":
				if(!array_key_exists('_flists', $this))
					$this->_flists = Todolist::all(array('user'=>$this->id), array('status','rank'));
				return $this->_flists;
			case "name":
				if($this->id == UserAuth::instance()->get_user()->id)
					return 'me';
				if($this->display_name)
					return $this->display_name;
				return $this->email;
			case "info":
//				if(!array_key_exists('_info', $this)){
					$this->_info = array();
					$sql = "select usrinfo_type as name, usrinfo_text as value from user_info " .
						"where usrinfo_user_type='user' and usrinfo_user_id = " . $this->id . " and (usrinfo_owner_id = " . $this->id .
						" or usrinfo_owner_id = " . UserAuth::instance()->get_user()->id . ")";
					$res = Database::instance()->query($sql);
					foreach($res as $r)
						$this->_info[] = array($r['name'],$r['value']);
//				}
				return $this->_info;
/*
			case "people":
				if(!array_key_exists('_people', $this)){
					$sql = "select distinct x.* from user as u join user_list as t on t.usrlist_user_id = u.usr_id join user_list as z on t.usrlist_list_id = z.usrlist_list_id join user as x on x.usr_id = z.usrlist_user_id where x.usr_id != " . $this->id . " and u.usr_id=" . $this->id;
					$this->_people = array();
					$resp = Database::instance()->query($sql);
					foreach($resp as $r) $this->_people[] = new User($r);
				}
				return $this->_people;
*/
			case "contacts":
				if(!array_key_exists('_contacts',$this)){
					$this->_contacts = array();
					$sql = "select * from user_rank where urank_owner_id=" . $this->id . " order by urank_rank asc";
					foreach(Database::instance()->query($sql) as $r){
						if($r['urank_user_type'] == 'user')
							$this->_contacts[] = User::from_id($r['urank_user_id']);
						else
							$this->_contacts[] = FloatingUser::from_id($r['urank_user_id']);
					}
				}
				return $this->_contacts;
			case "history":
				$sql = "select distinct todolist.* from todolist join user_list as x on x.usrlist_list_id = list_id join user_list as z on z.usrlist_list_id = x.usrlist_list_id where x.usrlist_user_id != z.usrlist_user_id and x.usrlist_user_id = " . $this->id . " and z.usrlist_user_id = " . UserAuth::instance()->get_user()->id;
				$ret = array();
				$resp = Database::instance()->query($sql);
				foreach($resp as $r) $ret[] = new Todolist($r);
				return $ret;
			default:
				throw new Exception('User does not contain property ' . $var);
		}
	}	
}

?>
