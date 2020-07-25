---
title: MySQL学习
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