<?php

class UserAuth extends Controller {
	public function __construct() {
		$this->declare_persistant();
	}
	
	// Data members
	private $_user=null;
	
	// Accessor for the currently logged in user
	public function get_user() {
		return $this->_user;
	}
	
	// Access the single object
	public static function instance() {
		return Core::load_controller("UserAuth");
	}
	
	/*
	 * Shows the splash page before the user logs in.
	 * If a user is logged in, redirect to an appropriate home page.
	 */
	public function distribute() {
		$template = new TemplateResponse("login.tpl", false);
		$template->set("page_title", PAGE_TITLE_BASE);
		$template->render();
	}

	public function login_user($username, $passwd){
		session_unset();
		$this->declare_persistant();

		$users = User::all(array('email' => $username, "password" => $passwd));
		if(!count($users)){
			return false;
		}

		$this->_user = current($users);

		return true;
	}
	
	
	/*
	 * Log out the current user.
	 */
	public function logout() {
		$this->end_persistant();
                session_destroy();
		$this->redirect("/");
	}
	
	public function template($temp){
		$t = new TemplateResponse($temp . '.tpl',false);
		$t->render();
	}
}

?>
