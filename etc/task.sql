# ************************************************************
# Sequel Pro SQL dump
# Version 3408
#
# http://www.sequelpro.com/
# http://code.google.com/p/sequel-pro/
#
# Host: localhost (MySQL 5.5.15)
# Database: task
# Generation Time: 2012-04-20 01:56:07 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table comment
# ------------------------------------------------------------

DROP TABLE IF EXISTS `comment`;

CREATE TABLE `comment` (
  `com_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `com_todo_id` int(10) unsigned NOT NULL,
  `com_created` int(10) unsigned NOT NULL,
  `com_created_by_id` int(10) unsigned NOT NULL,
  `com_text` text NOT NULL,
  `com_hours` float DEFAULT NULL,
  PRIMARY KEY (`com_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table comment_file
# ------------------------------------------------------------

DROP TABLE IF EXISTS `comment_file`;

CREATE TABLE `comment_file` (
  `cfile_comment_id` int(11) unsigned NOT NULL,
  `cfile_file_hash` char(40) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table file
# ------------------------------------------------------------

DROP TABLE IF EXISTS `file`;

CREATE TABLE `file` (
  `file_hash` char(40) NOT NULL DEFAULT '',
  `file_name` varchar(255) NOT NULL DEFAULT '',
  `file_uploaded_by_id` int(11) unsigned NOT NULL,
  `file_uploaded` int(11) NOT NULL,
  PRIMARY KEY (`file_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table floating_user
# ------------------------------------------------------------

DROP TABLE IF EXISTS `floating_user`;

CREATE TABLE `floating_user` (
  `fu_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `fu_name` varchar(255) NOT NULL DEFAULT '',
  `fu_email` varchar(255) DEFAULT NULL,
  `fu_created_by_id` int(11) unsigned NOT NULL,
  PRIMARY KEY (`fu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table todo
# ------------------------------------------------------------

DROP TABLE IF EXISTS `todo`;

CREATE TABLE `todo` (
  `todo_id` int(11) NOT NULL AUTO_INCREMENT,
  `todo_list_id` int(11) NOT NULL,
  `todo_text` text NOT NULL,
  `todo_created_by_id` int(11) NOT NULL,
  `todo_created` int(11) NOT NULL,
  `todo_claimed_by_id` int(10) unsigned DEFAULT NULL,
  `todo_completed_by_id` int(10) unsigned DEFAULT NULL,
  `todo_completed` int(11) DEFAULT NULL,
  `todo_deleted` int(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`todo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table todo_order
# ------------------------------------------------------------

DROP TABLE IF EXISTS `todo_order`;

CREATE TABLE `todo_order` (
  `to_user_id` int(10) unsigned NOT NULL,
  `to_todo_id` int(10) unsigned NOT NULL,
  `to_rank` int(10) unsigned NOT NULL,
  UNIQUE KEY `to_user_id` (`to_user_id`,`to_todo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table todolist
# ------------------------------------------------------------

DROP TABLE IF EXISTS `todolist`;

CREATE TABLE `todolist` (
  `list_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `list_name` varchar(255) CHARACTER SET latin1 NOT NULL,
  `list_text` text CHARACTER SET latin1,
  `list_deleted` int(1) unsigned NOT NULL DEFAULT '0',
  `list_startdate` int(11) DEFAULT NULL,
  `list_enddate` int(11) DEFAULT NULL,
  PRIMARY KEY (`list_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table user
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `usr_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `usr_email` varchar(255) CHARACTER SET latin1 NOT NULL,
  `usr_password` char(32) CHARACTER SET latin1 NOT NULL,
  `usr_display_name` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  PRIMARY KEY (`usr_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;

INSERT INTO `user` (`usr_id`, `usr_email`, `usr_password`, `usr_display_name`)
VALUES
	(1,'guest','084e0343a0486ff05530df6c705c8bb4','guest user');

/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table user_info
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_info`;

CREATE TABLE `user_info` (
  `usrinfo_user_id` int(11) unsigned NOT NULL,
  `usrinfo_type` varchar(255) NOT NULL DEFAULT '',
  `usrinfo_owner_id` int(10) unsigned NOT NULL,
  `usrinfo_text` text NOT NULL,
  `usrinfo_user_type` enum('user','float') NOT NULL DEFAULT 'user',
  UNIQUE KEY `usrinfo_user_id` (`usrinfo_user_id`,`usrinfo_owner_id`,`usrinfo_user_type`,`usrinfo_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table user_list
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_list`;

CREATE TABLE `user_list` (
  `usrlist_user_id` int(10) unsigned NOT NULL,
  `usrlist_list_id` int(10) unsigned NOT NULL,
  `usrlist_rank` int(10) unsigned NOT NULL,
  `usrlist_type` enum('owner','guest','collaborator') NOT NULL DEFAULT 'owner',
  `usrlist_status` enum('active','deleted','pending') NOT NULL DEFAULT 'active',
  UNIQUE KEY `usrlist_user_id` (`usrlist_user_id`,`usrlist_list_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table user_rank
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_rank`;

CREATE TABLE `user_rank` (
  `urank_owner_id` int(11) unsigned NOT NULL,
  `urank_user_id` int(11) unsigned NOT NULL,
  `urank_rank` int(10) unsigned NOT NULL,
  `urank_user_type` enum('user','float') NOT NULL DEFAULT 'user',
  PRIMARY KEY (`urank_owner_id`,`urank_user_id`,`urank_user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
