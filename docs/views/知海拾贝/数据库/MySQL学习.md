---
title: 数据库知识学习巩固
date: 2020-07-24
tags:
 - 数据库
categories:
 - 知海拾贝
---
:::tip
MySQL是最流行的关系型数据库，这次就从MySQL入手回顾数据库有关的知识。
:::
<!-- more -->

## 简要介绍
MySQL的安装、环境变量的配置以及数据库的结构就不赘述了。在创建新的database的时候需要选择字符集（默认为utf-8），在创建新表的时候可以选择存储引擎（默认InnoDB），每一种引擎都使用了不同的存储机制、索引技巧、锁定水平，需要根据需要选择使用：
* memory引擎使用存在内存中的内容来创建表。每个MEMORY表实际对应一个磁盘文件，格式是.frm。MEMORY类型的表访问非常快，因为它到数据是放在内存中的，并且默认使用HASH索引，但是一旦服务器关闭，表中的数据就会丢失，但表还会继续存在。
* MyISAM引擎它不支持事务，也不支持外键，尤其是访问速度快，对事务完整性没有要求或者以SELECT、INSERT为主的应用基本都可以使用这个引擎来创建表。每个MyISAM在磁盘上存储成3个文件，其中文件名和表名都相同，但是扩展名分别为: .frm(存储表定义) .MYD(MYData，存储数据) .MYI(MYIndex，存储索引)。索引和数据是分开的。
* InnoDB存储引擎提供了具有提交、回滚和崩溃恢复能力的事务安全。但是对比MyISAM的存储引擎，InnoDB写的处理效率差一些并且会占用更多的磁盘空间以保留数据和索引。

## DDL
### MySQL数据类型
在创建表时，为数据字段定义合适的类型对数据库的优化是非常重要的，MySQL支持所有标准SQL数值数据类型。大致可以分为三类：数值类型、字符串类型、日期和时间类型。其中开发中常用的一些数据类型有：
* double:浮点型，例如double(5,2)表示最多5位，其中必须有2位小数，即最大值为999.99;
* char:固定长度字符串类型; char(10)'abc
* varchar:可变长度字符串类型;varchar(10) 'abc'
* text:字符串类型;
* blob:二进制类型;
* date:日期类型，格式为:yyyy-MM-dd;
* time:时间类型，格式为:hh:mm:ss
* datetime:日期时间类型yyyy-MM-dd hh:mm:ss


### 创建数据库
`create database 数据库名 character set utf8`
### 修改数据库
`alter database 数据库名 character set gbk`
### 创建表
创建表的语句为：
```sql
CREATE TABLE 表名(
    列名1 数据类型 [约束],
    列名2 数据类型 [约束],
    ...
    列名3 数据类型 [约束]
);
```
注意最后一行没有逗号。
### 添加一列
`alter table 表名 add 列名 数据类型`
### 删除一列
`alter table 表名 drop 字段名`
### 修改一列的类型
`alter table 表名 modify 字段名 数据类型`
### 修改一列的名称
`alter table 表名 change 原始列名 新列名 数据类型`
### 修改表名
`rename table 原始表名 to 新表名`
### 修改表的字符集
`alter table 表名 character set utf8` 一般和数据库字符集一致，不去修改
### 查看建表的语句
`show create table 表名`
### 删除表
`drop 表名`

## DML
### 插入数据
```sql
insert into 表名 (列名1,列名2) value(列值1,列值2)
```
注意，列名与列值的类型、顺序要一一对应，列值不要超过定义的长度，字符串类型和日期类型都需要用单引号括起来。

要同时插入多行记录，使用：
```sql
insert into 表名 (列名1,列名2) values(列值1,列值2),(列值1,列值2),...
```
如果不指定列名，那么默认要插入包含全部列的一条记录。

### 更新数据
```sql
update 表名 set 列名1=列值1,列名2=列值2 where 列名=值
```
例如:

把所有学生的分数改为90：`update student set stu_score=90;`；

把姓名为张三的学生分数改为60：`update student set stu_score=60 where stu_name='张三';`；

把姓名为李四的学生年龄改为20分数改为75：`update student set stu_age=20,stu_score=75 where stu_name='李四';`；

把tom的年龄在原来的基础上加1岁：`update student set stu_age=stu_age+1 where stu_name='tom';`

在8.0版本后修改数据库的用户密码：
`alter user 'admin'@'localhost' identified by 'mypasswd';`
也可以在命令行使用`mysqladmin -u admin -p 新密码`回车后输入之前的密码就可以完成修改。

### 删除数据
可以使用`delete from student where id=1;`如果不指定where条件，就会删除全部内容。

使用`truncate table 表名`会直接删除表中全部内容。两者的区别是delete仅仅是删除表中数据，表结构还在，而truncate是吧表直接drop掉再创建一个同样的新表，执行速度比delete快。（结合自增auto_increment的表使用delete删除后不会从1开始来理解其用途）

## DQL
简单的指定的列的查询语句很简单：
`select stu_name,stu_age from student;`，执行该查询会得到一个虚拟结果集，它存储在内存中，并不是一个真实的表。

### 条件查询
进一步还可以使用where子句来对查询的条件作出限定，常用的运算符有：=(等于)、!=(不等于)、<>(不等于)、<(小于)、<=(小于等于)、>(大于)、>=(大于等于)；between ... and；in(set)；is null、is not null；and与 or或 not非。

选择性别为男且年龄为10的记录：
```sql
SELECT
	* 
FROM
	student 
WHERE
	stu_gender = '男' 
	AND stu_age = 10;
```

查询学号为1、3、5的学生记录：
```sql
SELECT
	* 
FROM
	student 
WHERE
	id IN ( 3, 5, 7 );
    # id=3 OR id=5 OR id=7; 这两句是等价的
```

查询年龄为null的记录
```sql
SELECT
    *
FROM
    student
WHERE
    stu_age IS NULL;
```

查询年龄在18~20之间的学生记录
```sql
SELECT
	* 
FROM
	student 
WHERE
	stu_age BETWEEN 10 AND 20;
    # stu_age>=18 AND stu_age<=20 等价
```

### 模糊查询
模糊查询也是一种条件查询，根据指定的关键字进行查询，使用LIKE关键字后跟通配符，通配符`_`表示任意一个字符，`%`表示任意多0~n个字符。

查询名字有五个字母组成并且最后一个字符为'y'的学生：
```sql
SELECT
	* 
FROM
	student 
WHERE
	stu_name LIKE '____y';
    # stu_name LIKE '李%' 姓李的学生
```

查询名字包含'天'的学生：
```sql
SELECT
	* 
FROM
	student 
WHERE
	stu_name LIKE '%天%';
```

### 字段控制
使用DISTINCT关键字可以对结果进行去重操作。还可以对查询结果进行运算。

查询学生年龄与成绩的和并起别名为total：
```sql
SELECT
	stu_age + stu_score total 
FROM
	student;
```
如果要对选择字段可能出现的空值作默认值处理的话可以使用IFNULL(属性名,默认值)函数：
```sql
SELECT
	IFNULL(stu_age,0) + IFNULL(stu_score,0) AS total # AS可以省略
FROM
	student;
```

### 查询结果排序
要对查询结果进行排序，可以使用ORDER BY子句。

查询所有学生的信息并按照年龄降序排序
```sql
SELECT
	* 
FROM
	student 
ORDER BY
	stu_age DESC; # 不写DESC默认为ASC
```

在上一条的基础上，如果年龄相同则按照成绩降序排序：
```sql
SELECT
	* 
FROM
	student 
ORDER BY
	stu_age DESC,
	stu_score DESC;
```

### 聚合函数
SQL中常用的聚合函数有：
* COUNT(): 统计指定列**不为NULL**的记录行数;
* MAX(): 计算指定列的最大值，如果指定列是字符串类型，那么使用字符串排序运算;
* MIN(): 计算指定列的最小值，如果指定列是字符串类型，那么使用字符串排序运算;
* SUM(): 计算指定列的数值和，如果指定列类型不是数值类型，那么计算结果为0;
* AVG(): 计算指定列的平均值，如果指定列类型不是数值类型，那么计算结果为0;

查询有成绩的学生数：
```sql
SELECT
	COUNT(stu_score)
FROM
	student;
```
查询成绩大于80分的学生人数：
```sql
SELECT
	COUNT(*) 
FROM
	student 
WHERE
	stu_score > 80;
```
查询姓名不为空的学生人数和性别不为空的学生人数（这两个计数可能不同）：
```sql
SELECT 
	COUNT(stu_name),
	COUNT(stu_gender)
FROM
	students;
```

查询所有学生的年龄之和和成绩之和：
```sql
SELECT
	SUM( stu_age ),
	SUM( stu_score ) 
FROM
	student;
```

查询学生成绩的平均值、最高值、最低值：
```sql
SELECT
	MAX( stu_score ),
	MIN( stu_score ),
	AVG( stu_score ) 
FROM
	student;
```

### 分组查询
使用GROUP BY子句实现分组查询，单独使用时只显示每组的第一条记录，所以group by后面直接跟的字段一般都会出现在select之后。

按照性别进行分组，查询每种性别的学生的姓名与学生的总成绩：
```sql
SELECT
	stu_gender 性别,
	GROUP_CONCAT( stu_name ) 姓名, # 每一组某字段的集合
	SUM(stu_score) 总分 # 每一组某字段的总合
	# MAX MIN AVG 等聚合函数都支持
FROM
	student 
GROUP BY
	stu_gender;
```

查询每种性别的学生分数高于60分的人数：
```sql
SELECT
	stu_gender 性别,
	COUNT(stu_score) 人数
FROM
	student 
WHERE
	stu_score > 80 
GROUP BY
	stu_gender;
```

此外，使用HAVING在分组查询后指定条件来输出结果（只能用在group by之后）

查询分数总和大于200分的性别组：
```sql
SELECT
	stu_gender 
FROM
	student 
GROUP BY
	stu_gender 
HAVING
	SUM( stu_score )> 200;
```
既然having 和where都是指定条件，那么他们的区别在哪里呢？having是在分组后对数据进行过滤，可以使用聚合函数；而where是在分组前对数据进行过滤，不可以后接聚合函数，如果某行记录不满足where子句的条件，那么它不会参加分组。

选择及格人数超过30人的班级名称和及格人数并按人数降序排列：
```sql
SELECT
	stu_class,
	COUNT(*)
FROM
	student
WHERE
	stu_score>=60
GROUP BY
	stu_class
HAVING
	COUNT(*) >30
ORDER BY 
	COUNT(*) DESC;
```

### 书写顺序与执行顺序
SQL语句的书写顺序为：select->from->where->group by->having->order by->limit

实际执行顺序为：from->where->group by->having->select->order by->limit

### 分页查询
使用LIMIT来控制分页查询，第一页从1开始，而实际数据库中从0开始。记每页要查询的记录数为pageSize，当前在第curPage页，则应写为：`LIMIT (curPage-1)*pageSize,pageSize`。

每页三条记录，选择第二页：
```sql
SELECT
	* 
FROM
	student 
	LIMIT 3,3;
```

## 数据完整性
### 实体完整性
实体完整性是为了确保每一行的数据不能完全重复，主键必须是唯一的。实体完整性的约束类型有三种：主键约束（primary key）、唯一约束（unique）和自动增长约束（auto_increment)。

主键数据唯一且不能为null，可以在创建表时在属性后面设置：
```sql
create table person(
    -> id bigint primary key,
    -> name varchar(50)
    -> );
```
也可以定义完属性后在最后设置主键：
```sql
create table person(
    -> id bigint,
    -> name varchar(50),
    -> age int,
    -> primary key(id)
    -> );
```
使用这种方式还可以创建联合主键，联合主键中所有字段同时相同时才违反主键约束
```sql
create table person(
    -> id bigint,
    -> name varchar(50),
    -> age int,
    -> primary key(id,name)
    -> );
```
我们还可以在创建完表之后再为其添加主键（但一般在设计表的时候就确定了主键）：
```sql
alter table person add constraint primary key(id);
```

唯一约束不允许字段内出现重复的值，但可以为空。
```sql
create table person(
    -> id bigint,
    -> name varchar(50) unique
    -> );
```
自动增长约束使用auto_increment，一般跟在数值型主键后。即使一条记录删除后，新的值依然从删除的序号开始继续往后增长。
```sql
create table person(
    -> id bigint primary key auto_increment,
    -> name varchar(50) unique
    -> );
```

### 域完整性
域完整性限制单元格内的数据的正确性，不与此列其它单元格作比较。主要包括数据类型约束（在定义表时就确定了）、非空约束（not null）和默认值约束（default）。

```sql
CREATE TABLE stu ( 
	id INT PRIMARY KEY auto_increment, 
	name VARCHAR ( 20 ) UNIQUE NOT NULL, 
	gender CHAR ( 1 ) DEFAULT '男' 
);
```

### 参照完整性
参照完整性是指表与表之间的对应关系，通常情况下可以通过设置两表之间的主键、外键关系，或者编写两表的触发器来实现。有对应参照完整性的两张表格，在对他们进行数据插入、更新、删除的过程中，系统都会将被修改表格与另一张对应表格进行对照，从而阻止一些不正确的数据的操作。

要建立参照完整性，主键类型和外键类型必须一致，所有表必须使用InnoDB引擎。假如我们有这样一张学生表：
```sql
CREATE TABLE stu (
	id INT PRIMARY KEY,
	name VARCHAR(50),
	age INT
);
```
那么建立成绩表时可以为其中的学生id设置外键，这里如果不为约束起名的话会自动生成一个名字：
```sql
CREATE TABLE score(
	sid INT,
	score INT,
	CONSTRAINT sc_st FOREIGN KEY(sid) REFERENCES stu(id)
);
```
此外在表建立完成后也可以为其添加外键约束：
```sql
ALTER TABLE score
add CONSTRAINT sc_st FOREIGN KEY(sid)REFERENCES stu(id);
```
***
**未完待续**