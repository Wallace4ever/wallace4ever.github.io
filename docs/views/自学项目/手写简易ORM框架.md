---
title: 手写简易ORM框架
date: 2020-06-01
tags:
 - ORM
categories:
 - 自学项目
---

:::tip
我们希望设计一个可以实现简单对象和SQL自动映射的框架，但是整体用法和设计比Hibernate、Mybatis简单，只保留基础的功能。本项目参考了高淇老师的Java300集课程，目的在于加深对ORM框架的理解，同时也增加对设计模式的理解。
:::
<!-- more -->

# 功能设计

## 框架主要功能
* 增：将对象生成相应的SQL语句，执行，插入数据库中
* 删：根据对象主键的值，生成SQL，执行，从数据库中删除
* 改：根据对象需要修改的属性的值，生成SQL，执行修改。
* 查：执行查询并按结果分类。
    * 多行多列：`List<Javabean>`
    * 一行多列：`Javabean`
    * 一行一列：
        * 普通对象：`Javabean`
        * 数字：`Number`

## 核心架构设计
* 核心类
    * Query接口：负责查询（对外提供服务的核心类），可以有针对MySQL、Oracle等不同数据库的实现，使用接口屏蔽具体数据库的差异
    * QueryFactory类：负责根据配置信息创建Query对象
    * TypeConvertor接口：负责类型转换
    * TableContext类：负责获取管理数据库所有表结构和类结构的关系，并可以根据表结构生成类结构
    * DBManager类：根据配置信息，维持连接对象的管理（增加连接池功能）
* 工具类
    * JDBCUtils：封装常用JDBC操作
    * StringUtils：封装常用字符串操作
    * JavaFileUtils：封装Java文件操作
    * ReflectUtils：封装常用反射操作
* 核心Javabean，封装相关数据：
    * ColumnInfo 封装表中一个字段的信息
    * TableInfo 封装一张表的信息
    * Configuration 封装配置文件信息（目前使用资源文件，后期可以增加XML文件配置和注解）

# 动手实现

## 初步建立源文件架构
首先对应上面的设计，在项目下新建`core`、`bean`、`utils`三个包，用于存放下面的类与接口。在接口中添加增删改查相关的方法。
```
orm
├── bean
│   ├── ColumnInfo.java
│   ├── Configuration.java
│   └── TableInfo.java
├── core
│   ├── DBManager.java
│   ├── QueryFactory.java
│   ├── Query.java
│   ├── TableContext.java
│   └── TypeConverter.java
├── db.properties
└── utils
    ├── JavaFileUtils.java
    ├── JDBCUtils.java
    ├── ReflectUtils.java
    └── StringUtil.java

```

其中，Query接口定义相关的增删改查方法
```java
public interface Query {
    /**
     * 直接执行一个DML语句
     */
    public int executeDML(String sql, Object[] params);

    /**
     * 将一个对象存储到数据库中
     */
    public void insert(Object object);

    /**
     * 删除cla表示类对应的表中指定id的记录
     */
    public int delete(Class cla, int id);//delete from user where id =2;

    /**
     * 删除对象在数据库中对应的记录（对象所属的类对应到表，对象主键的值对应到记录）
     */
    public void delete(Object object);

    /**
     * 更新对象对应的记录，并且只更新指定的字段的值
     */
    public int update(Object object, String[] filedNames);//update user set uname=?,pwd=? where id=?;

    /**
     * 查询返回多行记录，并将每行记录封装到cla指定类的对象中
     */
    public List queryRows(String sql, Class cla, Object[] params);

    /**
     * 查询返回一行记录，并将每行记录封装到cla指定类的对象中
     */
    public Object queryUniqueRow(String sql,Class cla, Object[] params);

    /**
     * 查询单个值，这时就不用封装到Javabean对象中了
     */
    public Object queryValue(String sql, Object[] params);

    /**
     * 查询单个数字，可以是Integer/Double/Long等等
     */
    public Number queryNumber(String sql, Object[] params);
}
```

创建以下Javabean，提供构造方法与get/set方法。

* TableInfo类的属性有：表名（String t_name）、所有字段的信息（`Map<String,ColumnInfo> columns`）、主键（ColumnInfo primaryKey）、联合主键（`List<ColumnInfo> primaryKeys`）。
* ColumnInfo类的属性有：字段名称（String name）、字段的数据类型（String dataType）、字段的键类型（int keyType [0：普通键；1：主键；2：外键]）。
* Configuration类的属性有：数据库驱动类、url、用户名、密码、数据库类型、项目源码路径等。

## 配置信息与DBManager
DBManager类维护一个Configuration对象，用于从资源文件中读取配置信息。
```java
private static Configuration conf=null;
static {//静态代码块，只需要加载一次配置资源文件
    Properties properties=new Properties();
    try {
        properties.load(Main.class.getResourceAsStream("db.properties"));
    } catch (IOException e) {
        e.printStackTrace();
    }
    conf=new Configuration();
    conf.setDriver(properties.getProperty("driver"));
    conf.setPoPackage(properties.getProperty("poPackage"));
    conf.setPwd(properties.getProperty("pwd"));
    conf.setSrcPath(properties.getProperty("srcPath"));
    conf.setUrl(properties.getProperty("url"));
    conf.setUser(properties.getProperty("user"));
    conf.setCurrentDB(properties.getProperty("currentDB"));
}
```

返回连接，维持连接对象的管理（后面增加连接池的功能）：
```java
public static Connection getConn() {
    try {
        Class.forName(conf.getDriver());
        //直接建立连接，后面增加连接池处理
        return DriverManager.getConnection(conf.getUrl(),conf.getUser(),conf.getPwd());
    } catch (ClassNotFoundException | SQLException e) {
        e.printStackTrace();
        return null;
    }
}
```
此外，TableContext类维护两个Map `Map<String, TableInfo> tables`和`Map<Class, TableInfo> poClassTableMap`，用于管理表结构与类结构的关系。使用`java.sql.DatabaseMetaData`来获得数据库表结构，并加载入Map中。

## MySQL数据类型转换器
设计一个MySqlTypeConverter类实现TypeConverter接口，转换MySQL中的数据类型名为Java中的数据类型名，供以后反射使用。
```java
public String db2JavaType(String columnType) {
    if ("varchar".equalsIgnoreCase(columnType)||"char".equalsIgnoreCase(columnType)) {
        return "String";
    }else if ("int".equalsIgnoreCase(columnType)
            ||"tinyint".equalsIgnoreCase(columnType)
            ||"smallint".equalsIgnoreCase(columnType)
            ||"integer".equalsIgnoreCase(columnType)
            ){
        return "Integer";
    }else if ("bigint".equalsIgnoreCase(columnType)){
        return "Long";
    }else if ("double".equalsIgnoreCase(columnType)){
        return "Double";
    }else if ("float".equalsIgnoreCase(columnType)){
        return "Float";
    }else if ("clob".equalsIgnoreCase(columnType)){
        return "java.sql.Clob";
    }else if ("blob".equalsIgnoreCase(columnType)){
        return "java.sql.Blob";
    }else if ("date".equalsIgnoreCase(columnType)){
        return "java.sql.Date";
    }else if ("time".equalsIgnoreCase(columnType)){
        return "java.sql.Time";
    }else if ("timestamp".equalsIgnoreCase(columnType)){
        return "java.sql.Timestamp";
    }
    return null;
}
```

未完待续