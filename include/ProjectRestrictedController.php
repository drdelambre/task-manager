<?php

abstract class ProjectRestrictedController extends Controller {
	public function prefix() {
		$ret = parent::prefix() && array_key_exists('_curr_project', UserAuth::instance()->get_user());
		if(!$ret) $this->redirect('/project');
		return true;
	}
}

?>
