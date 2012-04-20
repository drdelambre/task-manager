<?php

abstract class UserRestrictedController extends Controller {
	public function prefix() {
		return parent::prefix() && UserAuth::instance()->get_user() && !strlen(UserAuth::instance()->get_user()->email_hash);
	}
}

?>
