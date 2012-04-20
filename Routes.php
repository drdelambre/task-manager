<?php

// UserAuth controller
Core::add_route(new Route("/", "UserAuth", "distribute"));
Core::add_route(new Route("/logout", "UserAuth", "logout"));
Core::add_route(new Route("/template/{*}", "UserAuth", "template"));

// General user management mostly
Core::add_route(new Route("/json", "JsonProcess", "json"));
Core::add_route(new Route("/upload", "FileProcess", "upload"));
Core::add_route(new Route("/download/{*}", "FileProcess", "download"));
Core::add_route(new Route("/view/{*}", "FileProcess", "view"));
?>
