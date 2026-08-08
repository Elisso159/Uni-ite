-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema unibite_db
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema unibite_db
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `unibite_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `unibite_db` ;

-- -----------------------------------------------------
-- Table `unibite_db`.`student`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `unibite_db`.`student` (
  `st_id` INT NOT NULL AUTO_INCREMENT,
  `st_name` VARCHAR(20) NOT NULL,
  `st_surname` VARCHAR(30) NOT NULL,
  `st_university` VARCHAR(50) NOT NULL,
  `st_email` VARCHAR(50) NOT NULL,
  `st_password` VARCHAR(20) NOT NULL,
  `st_points` INT NULL DEFAULT NULL,
  PRIMARY KEY (`st_id`),
  UNIQUE INDEX `st_email` (`st_email` ASC) VISIBLE,
  UNIQUE INDEX `st_password` (`st_password` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 73
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `unibite_db`.`administrator`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `unibite_db`.`administrator` (
  `adm_id` INT NOT NULL AUTO_INCREMENT,
  `adm_st_id` INT NOT NULL,
  PRIMARY KEY (`adm_id`),
  INDEX `adm_st_id` (`adm_st_id` ASC) VISIBLE,
  CONSTRAINT `administrator_ibfk_1`
    FOREIGN KEY (`adm_st_id`)
    REFERENCES `unibite_db`.`student` (`st_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `unibite_db`.`consumer`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `unibite_db`.`consumer` (
  `cons_id` INT NOT NULL AUTO_INCREMENT,
  `cons_st_id` INT NOT NULL,
  PRIMARY KEY (`cons_id`),
  INDEX `cons_st_id` (`cons_st_id` ASC) VISIBLE,
  CONSTRAINT `consumer_ibfk_1`
    FOREIGN KEY (`cons_st_id`)
    REFERENCES `unibite_db`.`student` (`st_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `unibite_db`.`cook`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `unibite_db`.`cook` (
  `cook_id` INT NOT NULL AUTO_INCREMENT,
  `cook_st_id` INT NOT NULL,
  PRIMARY KEY (`cook_id`),
  INDEX `cook_st_id` (`cook_st_id` ASC) VISIBLE,
  CONSTRAINT `cook_ibfk_1`
    FOREIGN KEY (`cook_st_id`)
    REFERENCES `unibite_db`.`student` (`st_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 11
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `unibite_db`.`food`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `unibite_db`.`food` (
  `food_id` INT NOT NULL AUTO_INCREMENT,
  `food_timestamp` DATETIME NULL DEFAULT NULL,
  `food_title` VARCHAR(30) NULL DEFAULT NULL,
  `food_cook_id` INT NOT NULL,
  `food_portion` SMALLINT NULL DEFAULT NULL,
  `food_image` TEXT NULL DEFAULT NULL,
  `food_notes` TEXT NULL DEFAULT NULL,
  `food_allergens` SET('φυστίκι', 'σέλινο', 'γάλα', 'δημητριακά με γλουτένη', 'σπόροι σουσάμι', 'οστρακόδερμο', 'καρκινοειδή', 'ψάρι', 'αυγό', 'φασόλια σόγια', 'μουστάρδα', 'ξηροί καρποί', 'διοξείδιο του θείου') NULL DEFAULT NULL,
  `food_time_start` DATETIME NULL DEFAULT NULL,
  `food_time_end` DATETIME NULL DEFAULT NULL,
  `food_status` ENUM('ONGOING', 'FINISHED', 'EXPIRED') NULL DEFAULT NULL,
  `food_lat` DECIMAL(10,7) NULL DEFAULT NULL,
  `food_lng` DECIMAL(10,7) NULL DEFAULT NULL,
  `food_address` VARCHAR(80) NULL DEFAULT NULL,
  PRIMARY KEY (`food_id`),
  INDEX `food_cook_id` (`food_cook_id` ASC) VISIBLE,
  CONSTRAINT `food_ibfk_1`
    FOREIGN KEY (`food_cook_id`)
    REFERENCES `unibite_db`.`cook` (`cook_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `unibite_db`.`delivery`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `unibite_db`.`delivery` (
  `deli_id` INT NOT NULL AUTO_INCREMENT,
  `deli_food_id` INT NOT NULL,
  `deli_lat` DECIMAL(10,7) NOT NULL,
  `deli_lng` DECIMAL(10,7) NOT NULL,
  `deli_location` VARCHAR(80) NULL DEFAULT NULL,
  PRIMARY KEY (`deli_id`),
  INDEX `deli_food_id` (`deli_food_id` ASC) VISIBLE,
  CONSTRAINT `delivery_ibfk_1`
    FOREIGN KEY (`deli_food_id`)
    REFERENCES `unibite_db`.`food` (`food_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `unibite_db`.`requests`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `unibite_db`.`requests` (
  `req_id` INT NOT NULL AUTO_INCREMENT,
  `req_cook_id` INT NOT NULL,
  `req_cons_id` INT NOT NULL,
  `req_food_id` INT NOT NULL,
  `req_deli_id` INT NOT NULL,
  PRIMARY KEY (`req_id`),
  INDEX `req_cook_id` (`req_cook_id` ASC) VISIBLE,
  INDEX `req_cons_id` (`req_cons_id` ASC) VISIBLE,
  INDEX `req_food_id` (`req_food_id` ASC) VISIBLE,
  INDEX `req_deli_id` (`req_deli_id` ASC) VISIBLE,
  CONSTRAINT `requests_ibfk_1`
    FOREIGN KEY (`req_cook_id`)
    REFERENCES `unibite_db`.`cook` (`cook_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `requests_ibfk_2`
    FOREIGN KEY (`req_cons_id`)
    REFERENCES `unibite_db`.`consumer` (`cons_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `requests_ibfk_3`
    FOREIGN KEY (`req_food_id`)
    REFERENCES `unibite_db`.`food` (`food_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `requests_ibfk_4`
    FOREIGN KEY (`req_deli_id`)
    REFERENCES `unibite_db`.`delivery` (`deli_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

USE `unibite_db` ;

-- -----------------------------------------------------
-- procedure update_food_status
-- -----------------------------------------------------

DELIMITER $$
USE `unibite_db`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `update_food_status`()
BEGIN

UPDATE food
SET food_status = "EXPIRED"
WHERE food_time_start < NOW() - INTERVAL 48 HOUR AND food_status = "ONGOING";

END$$

DELIMITER ;
USE `unibite_db`;

DELIMITER $$
USE `unibite_db`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `unibite_db`.`before_select_food_status_update`
BEFORE INSERT ON `unibite_db`.`food`
FOR EACH ROW
BEGIN

UPDATE food
SET food_status="EXPIRED"
WHERE food_time_start < NOW() - INTERVAL 48 HOUR;

END$$


DELIMITER ;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
