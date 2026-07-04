
USE unibite_db;

CREATE TABLE IF NOT EXISTS food (
    food_id INT(5) NOT NULL AUTO_INCREMENT,
    food_title varchar(30),
    food_cook_id int(5) not null,
    food_portion smallint,
    food_image TEXT,
    food_notes TEXT,
    food_allergens SET('φυστίκι', 'σέλινο', 'γάλα', 'δημητριακά με γλουτένη', 'σπόροι σουσάμι', 'οστρακόδερμο', 'καρκινοειδή', 'ψάρι', 'αυγό', 'φασόλια σόγια', 'μουστάρδα', 'ξηροί καρποί', 'διοξείδιο του θείου'),
    food_status enum('ONGOING', 'FINISHED', 'EXPIRED'),
    primary key(food_id),
    
    foreign key (food_cook_id) references cook(cook_id)
    on delete cascade on update cascade
);


CREATE TABLE IF NOT EXISTS delivery (
	deli_id INT(5) NOT NULL auto_increment primary key,
    deli_food_id int(5) NOT NULL,
    deli_location varchar(80),
    deli_datetime datetime,
    
    foreign key (deli_food_id) references food(food_id)
    on delete cascade on update cascade
);


CREATE TABLE IF NOT EXISTS student (
	st_id INT(5) NOT NULL auto_increment primary key,
    st_university varchar(50) NOT NULL,
    st_email varchar(50) unique not null,
    st_username varchar(20) unique not null,
    st_password varchar(20) unique not null
);


CREATE TABLE IF NOT EXISTS cook (
	cook_id INT(5) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cook_st_id INT(5) NOT NULL,
    cook_credits int(3),
    cook_requests int(4),
    
    foreign key (cook_st_id) references student(st_id)
    on delete cascade on update cascade
);


CREATE TABLE IF NOT EXISTS consumer (
	cons_id INT(5) NOT NULL auto_increment PRIMARY KEY,
    cons_st_id INT(5) NOT NULL,
    
    foreign key (cons_st_id) references student(st_id)
    on delete cascade on update cascade
);


CREATE TABLE IF NOT EXISTS requests (
	req_id INT(5) NOT NULL auto_increment PRIMARY KEY,
    req_cook_id INT(5) NOT NULL,
    req_cons_id INT(5) NOT NULL,
	req_food_id INT(5) NOT NULL,
    req_deli_id INT(5) NOT NULL,
    
    foreign key (req_cook_id) references cook(cook_id)
    on delete cascade on update cascade,
    
    foreign key (req_cons_id) references consumer(cons_id)
    on delete cascade on update cascade,
    
    foreign key (req_food_id) references food(food_id)
    on delete cascade on update cascade,
    
    foreign key (req_deli_id) references delivery(deli_id)
    on delete cascade on update cascade
);


CREATE TABLE IF NOT EXISTS administrator (
	adm_id INT(3) NOT NULL auto_increment PRIMARY KEY,
    adm_st_id INT(5) NOT NULL,
    
    foreign key (adm_st_id) references student(st_id)
    on delete cascade on update cascade
);


SHOW TABLES;