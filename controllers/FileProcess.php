<?php
class FileProcess extends Controller {
	public function upload(){
		$filename = $_SERVER['HTTP_X_FILENAME'];
		$newName = sha1(microtime(false));
		$user = UserAuth::instance()->get_user();

		if(strtolower($_SERVER['REQUEST_METHOD']) != 'post'){
			print json_encode(array('status'=>'error','error'=>'wrong request method'));
			return;
		}

		if($filename){
			file_put_contents(PROJECT_ROOT_PATH . '/public/uploads/' . $newName, file_get_contents('php://input'));
			$sql = "INSERT INTO file (file_hash, file_name, file_uploaded_by_id, file_uploaded) VALUES (\"{$newName}\", \"{$filename}\", " . ($user?$user->id:0) . ", \"" . time() . "\")";
			Database::instance()->insert($sql);
			$ret = array(
				"status"=>"success",
				"hash"=> $newName,
				"name"=> $filename
			);
			print json_encode($ret);
			return;
		}
		
		print json_encode(array('status'=>'error','error'=>'something went wrong'));
		return;
	}

	public function view($hash){
		$name = Database::instance()->query("SELECT file_name as name FROM file WHERE file_hash = \"{$hash}\"");
		if(!count($name)) throw new Http404Exception();
		$name = $name[0]['name'];

		$file = PROJECT_ROOT_PATH . '/public/uploads/' . $hash;
		$finfo = new finfo(FILEINFO_MIME, "/usr/share/misc/magic.mgc");
		
		header('Content-Description: File Transfer');
		header('Content-Type: ' . $finfo->file($file));
		header('Content-Length: ' . filesize($file));

		header('Content-Disposition: inline; filename=' . $name);
		readfile($file);
	}
	
	public function download($hash){
		$name = Database::instance()->query("SELECT file_name as name FROM file WHERE file_hash = \"{$hash}\"");
		if(!count($name)) throw new Http404Exception();
		$name = $name[0]['name'];

		$file = PROJECT_ROOT_PATH . '/public/uploads/' . $hash;
		$finfo = new finfo(FILEINFO_MIME, "/usr/share/misc/magic.mgc");

		header('Content-Description: File Transfer');
		header('Content-Type: ' . $finfo->file($file));
		header('Content-Length: ' . filesize($file));

		header('Content-Disposition: attachment; filename=' . $name);
		readfile($file);
	}
}
?>