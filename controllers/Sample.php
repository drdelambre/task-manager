<?php

class Sample extends Controller {
	public function view(){
		if(!isset($_SESSION['timezone'])){
			$template = new TemplateResponse('sampleTimezone.tpl', false);
			$template->render();
			return;
		}
		
		$time = explode(':', date('H:i:s:n:Y'));
		$firstDay = mktime(0,0,0,$time[3]-1,1,$time[4]) - $_SESSION['timezone'];
		$lastDay = mktime(0,0,0,$time[3],0,$time[4]) - $_SESSION['timezone'];

		$template = new TemplateResponse('sample.tpl', false);
		$template->set('calStart', $firstDay);
		$template->set('calEnd', $lastDay);
		$template->set('evts','[
	{
		"date":"1325964600",
		"project":"test project",
		"text":"neat beans, this is a test of json parsing"
	}
	,
	{
		"date":"1325966400",
		"project":"test project",
		"text":"here is a calendar event that\'s a bit later"
	}
	,
	{
		"date":"1326156300",
		"project":"",
		"text":"this is a personal event, no project"
	}
	,
	{
		"date":"1326479400",
		"project":"test project",
		"text":"everything is passed in timestamps"
	}
	,
	{
		"date":"1326529800",
		"project":"test project",
		"text":"cause dates are only needed for display purposes"
	}
		]');
		$template->render();
	}

	public function copyDemo(){
		$user = UserAuth::instance()->get_user();
		if($user->id != 1) return;

		$db = Database::instance();
		$db->execute("
			delete todo_order.* from todo_order
				left join todo on todo.todo_id = todo_order.todo_order_todo_id
				left join todolist on todolist.td_list_id = todo.todo_list_id
			where
				todolist.td_list_project_id = 6
		");

		$db->execute("
			delete todo_comment.* from todo_comment
				left join todo on todo.todo_id = todo_comment.tdcom_todo_id
				left join todolist on todolist.td_list_id = todo.todo_list_id
			where
				todolist.td_list_project_id = 6
		");
			
		$db->execute("
			delete todo.* from todo
				left join todolist on todolist.td_list_id = todo.todo_list_id
			where
				todolist.td_list_project_id = 6
			
		");

		$db->execute("
			delete todolist_order.* from todolist_order
				left join todolist on todolist.td_list_id = todolist_order.td_list_order_list_id
			where
				todolist.td_list_project_id = 6
		");

		$db->execute("
			delete todolist.* from todolist
			where
				todolist.td_list_project_id = 6
		");


		$lists = $db->query("select todolist.* from todolist where todolist.td_list_project_id = 1");
		$output = '';
		foreach($lists as $list){
			$list['todos'] = $db->query("select todo.* from todo where todo_list_id = " . $list['td_list_id']);
			$output .= print_r($list, true) . "\n";
			$list['td_list_id'] = $db->insert("insert into todolist (td_list_title,td_list_text,td_list_project_id,td_list_created,td_list_created_by_id,td_list_deleted) VALUES (\"" . mysql_real_escape_string($list['td_list_title']) . "\",\"" . mysql_real_escape_string($list['td_list_text']) . "\",\"6\",\"" . $list['td_list_created'] . "\",\"" . $list['td_list_created_by_id'] . "\"," . $list['td_list_deleted'] . ")");
			foreach($list['todos'] as $todo){
				$todo['comments'] = $db->query("select todo_comment.* from todo_comment where todo_comment.tdcom_todo_id = " . $todo['todo_id']);
				$todo['todo_id'] = $db->insert("insert into todo (todo_text,todo_list_id,todo_created,todo_created_by_id,todo_completed,todo_completed_by_id,todo_visible) VALUES (\"" . mysql_real_escape_string($todo['todo_text']) . "\"," . $list['td_list_id'] . ",\"" . $todo['todo_created'] . "\"," . $todo['todo_created_by_id'] . "," . ($todo['todo_completed']?"\"" . $todo['todo_completed'] . "\"":'NULL') . "," . ($todo['todo_completed_by_id']?$todo['todo_completed_by_id']:'NULL') . "," . $todo['todo_visible'] . ")");
				foreach($todo['comments'] as $comment)
					$db->insert("insert into todo_comment (tdcom_todo_id,tdcom_text,tdcom_created,tdcom_created_by_id) VALUES (" . $todo['todo_id'] . ",\"" . mysql_real_escape_string($comment['tdcom_text']) . "\",\"" . $comment['tdcom_created'] . "\"," . $comment['tdcom_created_by_id'] . ")");
			}
		}
		
		throw new Exception($output);
	}
	
	public function json(){
		$jsObj = json_decode(file_get_contents("php://input"));
		if($jsObj->{'type'} == 'user'){
			if($jsObj->{'request'} == 'timezone'){
				$_SESSION['timezone'] = $jsObj->{'timezone'};
			}
		}

		if($jsObj->{'type'} == 'todolist'){
			if($jsObj->{'request'} == 'edit'){
				
			}
		}
	}
}

?>
