<?php
class JsonProcess extends Controller {
	public function json(){
		header('Content-type: application/json');
		$json = json_decode(file_get_contents("php://input"));
		if($json->{'type'} == 'user'){
			if($json->{'request'} == 'login'){
				if(!UserAuth::instance()->login_user($json->{'email'},$json->{'password'})){
					$ret = array(
						'status'=>'error',
						'error'=>'user not found'
						);
					print json_encode($ret);
					return;
				}
				$ret = array('status'=>'success');
				print json_encode($ret);
			}
			if($json->{'request'} == 'signup'){
				$ret = array(
					'status'=>'error',
					'error'=>'not accepting new users'
					);


//				$ret = array('status'=>'success');
				print json_encode($ret);
			}
			if($json->{'request'} == 'timezone'){
				$_SESSION['timezone'] = $json->{'timezone'};
			}
		}

		$user = UserAuth::instance()->get_user();
		if(!$user){
			$ret = array(
				"status"=>"error",
				"error"=>"you must be logged in"
			);
			
			print json_encode($ret);
			return;
		}
		$db = Database::instance();

		if($json->{'type'} == 'todolist'){
			if($json->{'request'} == 'edit'){
				$list;
				if(!$json->{'id'}){
					$list = new TodoList();
				} else {
					$list = Todolist::from_id($json->{'id'});
				}
				
				$list->name =  htmlentities($json->{'name'});
				$list->text =  $json->{'description'}?htmlentities($json->{'description'}):null;
				if($json->{'start'}) $list->startdate = $json->{'start'};
				else if($list->startdate) $list->startdate = null;
				if($json->{'end'}){
					if(!$json->{'start'}) $list->startdate = time();
					$list->enddate = $json->{'end'};
				} else if($list->enddate) $list->enddate = null;
				$list->save();
				
				if(!$json->{'id'}){
					$ins = 'in (';
					foreach($json->{'invites'} as $email)
						$ins .= "'{$email}',";
					$ins = rtrim($ins,',') . ')';

					if(count($json->{'invites'})){
						$sql = 'select usr_email as email from user where usr_email not ' . $ins;
						$unusers = $db->query($sql);
						//invite these bitches
	
						$sql = "insert into user_list(usrlist_user_id,usrlist_list_id,usrlist_rank,usrlist_type)
							select usr_id, " . $list->id . ", 0, case usr_id when " . $user->id . " then 'owner' else 'collaborator' end from user where usr_id " . $ins .
							" on duplicate key update set usrlist_rank=values(usrlist_rank)";
						$db->insert($sql);
					}

					$sql = 'update user_list set usrlist_rank = usrlist_rank + 1 where usrlist_status != "deleted" and usrlist_user_id=' . $user->id;
					$db->update($sql);
					$sql = 'insert into user_list(usrlist_user_id, usrlist_list_id,usrlist_rank,usrlist_type) values (' . $user->id . ',' . $list->id . ', 0,"owner")';
					$db->insert($sql);
					if(array_key_exists('_lists', $user))
						array_unshift($user->_lists, $list);
				} else {
					unset($user->_lists);
				}
				
				$ret = array(
					'status' => 'success',
					'id' => $list->id,
					'name' => $list->name
				);
				
				if($list->text) $ret['description'] = $list->text;
				if($list->startdate) $ret['start'] = $list->startdate;
				if($list->enddate) $ret['end'] = $list->enddate;
				
				print json_encode($ret);
			}
			if($json->{'request'} == 'remove'){
				$sql = 'update user_list set usrlist_rank=0, usrlist_status="deleted" where usrlist_list_id=' . $json->{'id'} . ' and usrlist_user_id=' . $user->id;
				$db->update($sql);

				// should remove list instead of triggering refresh
				unset($user->_lists);
				$ret = array('status'=>'success');
				print json_encode($ret);
			}
			if($json->{'request'} == 'reorder'){
				$order = $json->{'order'};
				$sql = "insert into user_list(usrlist_user_id,usrlist_list_id,usrlist_rank,usrlist_type) value ";
				for($ni = 0; $ni < count($order); $ni++)
					$sql .= " (" . $user->id . ",{$order[$ni]}," . ($ni+1) . ",null),";
				$sql = rtrim($sql,',');
				$sql .= " on duplicate key update usrlist_rank=values(usrlist_rank), usrlist_type=usrlist_type";
				$db->update($sql);
				
				unset($user->_lists);
				$ret = array('status'=>'success');
				print json_encode($ret);
			}
			if($json->{'request'} == 'fetch'){
				$list = Todolist::from_id($json->{'id'});
				$dead = $list->completed_todos($json->{'start'}, 10, 'desc');
				$ret = array(
					'status'=>'success',
					'entries'=>array()
				);
				foreach($dead as $d){
					$rete = array(
						'id' => $d->id,
						'list' => $d->list_id,
						'text' => $d->text
					);
					
					if($d->completed){
						$rete['completed'] = $d->completed;
						$rete['completed_by'] = $d->completed_by->name;
					} else {
						$rete['created'] = $d->created;
					}
					
					$ret['entries'][] = $rete;
				}
				
				print json_encode($ret);
			}
			if($json->{'request'} == 'info'){
				$list = Todolist::from_id($json->{'id'});
				$ret = array(
					'status'=>'success',
					'id'=>$list->id,
					'name'=>$list->name
				);

				if(strlen($list->text))
					$ret['text'] = $list->text;

				if($list->startdate)
					$ret['start'] = $list->startdate;
				if($list->enddate)
					$ret['end'] = $list->enddate;

				print json_encode($ret);
			}
		}
		
		if($json->{'type'} == 'todo'){
			if($json->{'request'} == 'edit'){
				$todo;
				if(!$json->{'id'}){
					$todo = new TodoObject();
					$todo->created_by_id = $user->id;
					$todo->created = time();
				} else {
					$todo = TodoObject::from_id($json->{'id'});
				}

				if($json->{'list'})
					$todo->list_id = $json->{'list'};

				if($json->{'completed'}){
					$todo->completed = time();
					$todo->completed_by_id = $user->id;
					$todo->claimed_by_id = null;
					if($todo->rank){
						$sql = "update todo_order join todo on to_todo_id=todo_id set to_rank = to_rank - 1 where to_user_id = " .
							$user->id . " and todo_list_id=" . $todo->list_id . " and to_rank > " . $todo->rank;
						$db->update($sql);
						$sql = "delete from todo_order where to_user_id=" . $user->id . " and to_todo_id=" . $todo->id;
						$db->execute($sql);
					}
				} else if($json->{'completed'} === false){
					$todo->completed = null;
					$todo->completed_by_id = null;
					$sql =	"insert into todo_order(to_user_id,to_todo_id,to_rank) " .
							"select " . $user->id . ", " . $todo->id . ", count(*) from todo_order ".
							"left join todo on todo_id = to_todo_id ".
							"where todo_list_id=" . $todo->list_id . " and to_user_id=" . $user->id .
							" on duplicate key update to_rank=values(to_rank)";
					$db->insert($sql);
				}

				if($json->{'list'})
					$todo->list_id = $json->{'list'};
				if($json->{'text'})
					$todo->text =  htmlentities($json->{'text'});

				$todo->save();
				
				if(!$json->{'id'}){
					$sql =	"insert into todo_order(to_user_id,to_todo_id,to_rank) " .
							"select " . $user->id . ", " . $todo->id . ", count(*) from todo_order ".
							"left join todo on todo_id = to_todo_id ".
							"where todo_list_id=" . $todo->list_id . " and to_user_id=" . $user->id;
					$db->insert($sql);
				}
				
				$ret = array(
					'status' => 'success',
					'id' => $todo->id,
					'list' => $todo->list_id,
					'text' => $todo->text
				);
				
				if($todo->completed){
					$ret['completed'] = $todo->completed;
					$ret['completed_by'] = $todo->completed_by->name;
				} else {
					$ret['created'] = $todo->created;
				}
				
				$coms = $todo->comments;
				if(count($coms)){
					$ret['commentCount'] = count($coms);
					$ret['comments'] = array();
					foreach($todo->comments(0,5,'desc') as $c){
						$rete = array(
							'id'=>$c->id,
							'text'=>$c->text,
							'creator'=>$c->created_by->name,
							'created'=>$c->created
						);
						if($c->hours)
							$rete['hours'] = $c->hours;
						$ret['comments'][] = $rete;
					}
				}

				print json_encode($ret);
			}
			if($json->{'request'} == 'addComment'){
				$com = new TodoComment();
				$com->todo_id = $json->{'todo'};
				$com->created_by_id = $user->id;
				$com->created = time();
				$com->text =  htmlentities($json->{'text'});

				if($json->{'hours'})
					$com->hours = $json->{'hours'};

				$com->save();

				$ret = array(
					'status'=>'success',
					'id'=>$com->id,
					'text'=>$com->text,
					'creator'=>'me',
					'created'=>$com->created
				);
				if($json->{'hours'})
					$ret['hours'] = $com->hours;
				if($json->{'files'}){
					$ret['files'] = array();
					$sql = "insert into comment_file(cfile_comment_id,cfile_file_hash) values ";
					foreach($json->{'files'} as $f){
						$ret['files'][] = array($f[0],$f[1]);
						$sql .= "(" . $com->id . ",'" . $f[0] . "'),";
					}
					$sql = rtrim($sql,',');
					$db->insert($sql);
				}

				print json_encode($ret);
			}
			if($json->{'request'} == 'remove'){
				$todo = TodoObject::from_id($json->{'id'});
				$todo->deleted = 1;
				$todo->save();
				
				$sql = "update todo_order join todo on to_todo_id=todo_id set to_rank = to_rank - 1 where ".
					"todo_list_id=" . $todo->list_id . " and to_rank > " . $todo->rank;
				$db->update($sql);
				$sql = "delete from todo_order where to_todo_id=" . $todo->id;
				$db->execute($sql);

				$ret = array('status'=>'success');
				print json_encode($ret);
			}
			if($json->{'request'} == 'reorder'){
				$todo = TodoObject::from_id($json->{'id'});
				$order = $json->{'order'};
				$ret = array('status'=>'success');
				$debug = array();

				if($json->{'list'} != $todo->list_id){
					$debug[] = "not in list";
					$old = $todo->list_id;
					$new = $json->{'list'};

					$sql = "select count(*) as count from todo where todo_list_id=" . $json->{'list'};
					$count = $db->query($sql);
					$count = $count[0]['count'];

					$todo->list_id = $json->{'list'};
					unset($todo->_list);
					$todo->save();

					$sql = "insert into todo_order(to_user_id, to_todo_id, to_rank)
						select t.to_user_id, t.to_todo_id, t.to_rank - 1
						from todo_order as t
							join todo_order as j on j.to_user_id = t.to_user_id
							join todo on t.to_todo_id = todo_id
						where todo_list_id = {$old}
							and j.to_todo_id = " . $todo->id . "
							and t.to_rank > j.to_rank
						order by t.to_rank
						on duplicate key update to_rank=values(to_rank)";
					$debug[] = $sql;
					$db->insert($sql);
				}
				$debug[] = "in list";
				$sql = "insert into todo_order(to_user_id,to_todo_id,to_rank) values ";
				for($ni = 1; $ni < count($order); $ni++)
					$sql .= "(" . $user->id . "," . $order[$ni] . ",{$ni}),";
				$sql = rtrim($sql,',');
				$sql .= " on duplicate key update to_rank=VALUES(to_rank)";

				$debug[] = $sql;
				$db->insert($sql);
				
				$ret['debug'] = $debug;
				
				print json_encode($ret);
			}
			if($json->{'request'} == 'fetch'){
				$todo = TodoObject::from_id($json->{'id'});
				$com = $todo->comments($json->{'start'}, 5, 'desc');
				$ret = array(
					'status'=>'success',
					'entries'=>array()
				);
				foreach($com as $c){
					$rete = array(
						'id'=>$c->id,
						'text'=>$c->text,
						'creator'=>$c->created_by->name,
						'created'=>$c->created
					);
					if($c->hours)
						$rete['hours'] = $c->hours;
					
					$ret['entries'][] = $rete;
				}
				
				print json_encode($ret);
			}
			if($json->{'request'} == 'claim'){
				$todo = TodoObject::from_id($json->{'id'});
				if($json->{'claim'}===false)
					$todo->claimed_by_id = null;
				else
					$todo->claimed_by_id = $user->id;
				$todo->save();
				
				print json_encode(array('status'=>'success'));
			}
		}

		if($json->{'type'} == 'timer'){
			$ret = array("status"=>"success");
			if($json->{'request'} == 'getTime'){
				if(array_key_exists('_timer', $user)){
					$ret['time'] = $user->_timer['time'];
					$ret['diff'] = $user->_timer['diff'];
					if(array_key_exists('start', $user->_timer))
						$ret['start'] = true;
				}
			}
			if($json->{'request'} == 'setTime'){
				$user->_timer = array('time' => $json->{'time'}, 'diff' => $json->{'diff'});
				if($json->{'start'})
					$user->_timer['start'] = true;
			}
			
			print json_encode($ret);
		}
		
		if($json->{'type'} == 'contact'){
			if($json->{'request'} == 'autocomplete'){
				$ret = array();
				$beans = $user->contacts;
				foreach($beans as $b){
					if($b->email){
						if(stripos($b->name, $json->{'value'}) !== false)
							$ret[] = array($b->id, $b->name, 'user');
						else if(stripos($b->email, $json->{'value'}) !== false)
							$ret[] = array($b->id, $b->email, 'user');
					} else {
						if(stripos($b->name, $json->{'value'}) !== false)
							$ret[] = array($b->id, $b->name, 'float');
					}
				}
				
				$resp = array('status'=>'success');
				if(count($ret)){
					$resp["count"] = count($ret);
					$resp["matches"] = array_slice($ret,0,5);
				}
				print json_encode($resp);
			}
			if($json->{'request'} == 'complete'){
				$ret = array();
				$beans = $user->contacts;
				foreach($beans as $b){
					if($b->email){
						if(stripos($b->name, $json->{'value'}) !== false)
							$ret[] = array($b->id, $b->name, 'user');
						else if(stripos($b->email, $json->{'value'}) !== false)
							$ret[] = array($b->id, $b->email, 'user');
					} else {
						if(stripos($b->name, $json->{'value'}) !== false)
							$ret[] = array($b->id, $b->name, 'float');
					}
				}
				
				$resp = array('status'=>'success');
				if(count($ret)){
					$resp["count"] = count($ret);
					$resp["matches"] = $ret;
				}
				print json_encode($resp);
			}
			if($json->{'request'} == 'new'){
				$nu = new FloatingUser();
				$nu->created_by_id = $user->id;
				$nu->name = $json->{'name'};
				$nu->save();

				$sql = 'insert into user_rank(urank_owner_id,urank_user_id,urank_user_type,urank_rank) values (' .  $user->id . ',' . $nu->id . ',"float",0)';
				$db->insert($sql);
				
				if(array_key_exists('_contacts',$user))
					array_unshift($user->_contacts, $nu);
				
				$ret = array(
					'status'=>'success',
					'id'=>$nu->id,
					'name'=>$nu->name
				);
				
				print json_encode($ret);
			}
			if($json->{'request'} == 'reorder'){
				$users = $json->{'users'};
				$sql = "insert into user_rank(urank_owner_id,urank_user_id,urank_rank,urank_user_type) values ";
				for($ni = 0; $ni < count($users); $ni++)
					$sql .= "(" . $user->id . "," . $users[$ni][0] . "," . ($ni+1) . ",'" . $users[$ni][1] . "'),";
				$sql = rtrim($sql, ',') . ' on duplicate key update urank_rank=values(urank_rank)';
				$db->insert($sql);
			}
			if($json->{'request'} == 'editInfo'){
				$sql = "insert into user_info (usrinfo_user_id, usrinfo_user_type,usrinfo_owner_id,usrinfo_type,usrinfo_text) values (" .
					$json->{'id'} . ",'" . $json->{'user'} . "'," . $user->id . ",'" . $json->{'key'} . "','" . $json->{'value'} . "') ".
					" on duplicate key update usrinfo_text=values(usrinfo_text)";
				$db->insert($sql);
				print json_encode(array(
					'status'=>'success',
					'key'=>$json->{'key'},
					'value'=>$json->{'value'}
				));
			}
		}

		if($json->{'type'} == 'file'){
			if($json->{'request'} == 'remove'){
				$hashes = $json->{'hash'};
				if(!is_array($hashes)) $hashes = array($hashes);
				$sql = 'in(';
				foreach($hashes as $h) $sql .= '"' . $h . '",';
				$sql = rtrim($sql,',') . ')';
				$sql = 'delete from file where file_hash ' . $sql . ' and file_uploaded_by_id=' . $user->id;
				if($db->update($sql) == count($hashes)){
					foreach($hashes as $h) unlink(PROJECT_ROOT_PATH . '/public/uploads/' . $h);
				}
			}
		}
	}
}
?>