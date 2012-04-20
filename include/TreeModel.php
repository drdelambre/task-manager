<?php
class TreeModel extends Model {
	public static function tree($root=null) {
		$results = array();

		if($root) {
			if(!is_object($root))
					$root = parent::from_id($root);
			$root->_children = array();
			
			$sql =  "SELECT * FROM " . self::$_table .
					" WHERE " . self::$_prefix . "_left_bound > " . $root->left_bound . " AND " .
					self::$_prefix . "_right_bound < " . $root->right_bound .
					" ORDER BY " . self::$_prefix . "_left_bound DESC";
			$stack = array();
			foreach(Database::instance()->query($sql) as $row){
				$curr = new self($row);
				$curr->_children = array();
				while(count($stack) > 0 && end($stack)->right_bound < $curr->right_bound)
					$curr->_children[] = array_pop($stack);
				$stack[] = $curr;
			}

			while(count($stack) > 0)
				$root->_children[] = array_pop($stack);

			$results[0] = $root;
		} else {
			$roots = array();
			$sql =  "SELECT node.*, (COUNT(parent." . self::$_prefix . "_id) - 1) AS depth " .
					"FROM " . self::$_table . " AS node, " . self::$_table . " AS parent " .
					"WHERE node." . self::$_prefix . "_left_bound " .
					"BETWEEN parent." . self::$_prefix . "_left_bound AND parent." . self::$_prefix . "_right_bound " .
					"AND parent." . self::$_prefix . "_right_bound > 0 AND parent." . self::$_prefix . "_left_bound > 0 " .
					"GROUP BY node." . self::$_prefix . "_id " .
					"HAVING depth=0 ORDER BY node." . self::$_prefix . "_left_bound";
			foreach(Database::instance()->query($sql) as $row)
			   $roots[] = current(self::tree(new self($row)));
			$results = $roots;
		}

		return $results;
	}

	public function moveNode($parentNode){
		$db = Database::instance();
		if(!isset($this->id)) $this->save();
		if($this->left_bound != 0){
			$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound = 0, " .
					self::$_prefix . "_right_bound = 0 WHERE " . self::$_prefix . "_id = " . $this->id;
			$db->update($sql);
			if(($this->right_bound - $this->left_bound) > 1){
				$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound = " .
						self::$_prefix . "_left_bound - 1, " . self::$_prefix . "_right_bound = " .
						self::$_prefix . "_right_bound - 1 WHERE " . self::$_prefix .
						"_left_bound BETWEEN " . $this->left_bound . " AND " . $this->right_bound;
				$db->update($sql);
			}
			$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound = " .
					self::$_prefix . "_left_bound - 2 WHERE " . self::$_prefix . "_left_bound > " .$this->right_bound;
			$db->update($sql);
			$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_right_bound = " .
					self::$_prefix . "_right_bound - 2 WHERE " . self::$_prefix . "_right_bound > " . $this->right_bound;
			$db->update($sql);
		}
		$parentNode = self::from_id($parentNode->id);
		$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound=" .
				self::$_prefix . "_left_bound+2 WHERE " . self::$_prefix . "_left_bound > " .
				$parentNode->left_bound;
		$db->update($sql);

		$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_right_bound=" .
				self::$_prefix . "_right_bound+2 WHERE " . self::$_prefix . "_right_bound > " .
				$parentNode->left_bound;
		$db->update($sql);

		unset($this->_parent);
		$this->left_bound = $parentNode->left_bound + 1;
		$this->right_bound = $parentNode->left_bound + 2;
		$this->save();
	}

	public function moveTree($parentNode){
		$subtree_width = ($this->right_bound - $this->left_bound) + 1;
		$db = Database::instance();
		
		if(!isset($this->id) || $this->left_bound == 0 || !count($this->children)){
			$this->moveNode($parentNode);
			return;
		}
		unset($this->_parent);
		self::_virtualize_tree($this);
		$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound=0, " .
				self::$_prefix . "_right_bound=0 WHERE " . self::$_prefix . "_left_bound >= " . $this->left_bound .
				" AND " . self::$_prefix . "_right_bound <= " . $this->right_bound;
		$db->update($sql);
		if($parentNode->right_bound < $this->right_bound){
			$greater = $this->left_bound;
			$lesser = $parentNode->right_bound;
		} else {
			$greater = $parentNode->right_bound;
			$subtree_width *= -1;
			$lesser = $this->right_bound;
		}

		$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound = " . self::$_prefix .
				"_left_bound + $subtree_width WHERE " . self::$_prefix . "_left_bound >= " . $lesser .
				" AND " . self::$_prefix . "_left_bound <= " . $greater;
		$db->update($sql);

		$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_right_bound = " . self::$_prefix .
				"_right_bound + $subtree_width WHERE " . self::$_prefix . "_right_bound >= " . $lesser .
				" AND " . self::$_prefix . "_right_bound < " . $greater;
		$db->update($sql);

		$offset = self::from_id($parentNode->id)->right_bound - abs($subtree_width) - 1;
		$this->_cleanTree($offset);
		$this->saveTree();
		unset($this->_children);
	}

	public function moveToRoot(){
		$db = Database::instance();
		if(isset($this->id) && $this->left_bound != 0){
			$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound = 0, " .
					self::$_prefix . "_right_bound = 0 WHERE " . self::$_prefix . "_id = " . $this->id;
			$db->update($sql);

			$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound = " .
					self::$_prefix . "_left_bound - 2 WHERE " . self::$_prefix . "_left_bound > " .$this->right_bound;
			$db->update($sql);
			$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_right_bound = " .
					self::$_prefix . "_right_bound - 2 WHERE " . self::$_prefix . "_right_bound > " . $this->right_bound;
			$db->update($sql);
		}
		$end = self::_getTreeEnd();
		$this->left_bound = $end + 1;
		$this->right_bound = $end + 2;
		$this->save();
	}

	public function moveTreeToRoot(){
		if(!isset($this->id)) $this->save();
		if($this->left_bound == 0 || !count($this->children)){
			$this->moveToRoot();
			return;
		}
		$db = Database::instance();
		$width = ($this->right_bound - $this->left_bound) + 1;

		self::_virtualize_tree($this);

		$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound=0, " .
				self::$_prefix . "_right_bound=0 WHERE " . self::$_prefix . "_left_bound >= " . $this->left_bound .
				" AND " . self::$_prefix . "_right_bound <= " . $this->right_bound;
		$db->update($sql);

		$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound = " .
				self::$_prefix . "_left_bound - $width WHERE " . self::$_prefix . "_left_bound > " .$this->right_bound;
		$db->update($sql);

		$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_right_bound = " .
				self::$_prefix . "_right_bound - $width WHERE " . self::$_prefix . "_right_bound > " . $this->right_bound;
		$db->update($sql);

		$this->_cleanTree(self::_getTreeEnd());
		$this->saveTree();
	}

	public function removeNode(){
		$db = Database::instance();
		if(isset($this->id)){
			$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound = 0, " .
					self::$_prefix . "_right_bound = 0 WHERE " . self::$_prefix . "_id = " . $this->id;
			$db->update($sql);
			if(($this->right_bound - $this->left_bound) > 1){
				$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound = " .
						self::$_prefix . "_left_bound - 1, " . self::$_prefix . "_right_bound = " .
						self::$_prefix . "_right_bound - 1 WHERE " . self::$_prefix .
						"_left_bound BETWEEN " . $this->left_bound . " AND " . $this->right_bound;
				$db->update($sql);
			}
			$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound = " .
					self::$_prefix . "_left_bound - 2 WHERE " . self::$_prefix . "_left_bound > " .$this->right_bound;
			$db->update($sql);

			$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_right_bound = " .
					self::$_prefix . "_right_bound - 2 WHERE " . self::$_prefix . "_right_bound > " . $this->right_bound;
			$db->update($sql);
		}
	}

	public function removeTree(){
		$db = Database::instance();
		$delta = $this->right_bound - $this->left_bound + 1;
		if(isset($this->id) && $this->left_bound != 0){
			$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound=0, " .
					self::$_prefix . "_right_bound=0 WHERE " . self::$_prefix . "_left_bound >= " . $this->left_bound .
					" AND " . self::$_prefix . "_right_bound <= " . $this->right_bound;
			$db->update($sql);

			$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_left_bound=" .
					self::$_prefix . "_left_bound-$delta WHERE " . self::$_prefix . "_left_bound > " .
					$this->right_bound;
			$db->update($sql);

			$sql = "UPDATE " . self::$_table . " SET " . self::$_prefix . "_right_bound=" .
					self::$_prefix . "_right_bound-$delta WHERE " . self::$_prefix . "_right_bound > " .
					$this->right_bound;
			$db->update($sql);
		}
		$this->left_bound = $this->right_bound = 0;
		if(isset($this->_children)) unset($this->_children);
	}
	
	public function saveTree(){
		foreach($this->children as $child) $child->saveTree();
		$this->save();
	}

	public function _cleanTree($offset = 0){ self::_cleanTree_r($this, $offset); }
	private static function _cleanTree_r(&$obj, &$left){
		$left++;
		$obj->left_bound = $left;
		foreach($obj->children as $child) self::_cleanTree_r($child, $left);
		$left++;
		$obj->right_bound = $left;
	}

	private static function _getTreeEnd(){
		$sql = "SELECT " . self::$_prefix . "_right_bound FROM " . self::$_table . " ORDER BY " . self::$_prefix . "_right_bound DESC LIMIT 1";
		$row = current(Database::instance()->query($sql));
		return $row[self::$_prefix . "_right_bound"];
	}
	
	private static function _virtualize_tree(&$obj){ foreach($obj->children as $child) self::_virtualize_tree($child); }

	/** copy these get variables if you plan to overwrite this function in your extention */
	public function __get($var) {
		switch($var) {
			case "children":
				if(!array_key_exists("_children", $this))
					$this->_children = self::tree($this)->_children;
				return $this->_children;
			case "parent_node":
				if(!array_key_exists("_parent", $this)){
					$sql = "SELECT parent.* FROM " . static::$_table . " AS parent, " .
							static::$_table . " AS node WHERE node." . static::$_prefix .
							"_left_bound > parent." . static::$_prefix . "_left_bound AND node." .
							static::$_prefix . "_left_bound < parent." . static::$_prefix .
							"_right_bound AND node." . static::$_prefix . "_id = " . $this->id;
					$rows = Database::instance()->query($sql);
					$this->_parent = new self($rows[0]);
				}
				return $this->_parent;
		}
	}
}
?>	
