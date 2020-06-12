---
title: Java获取项目资源的两种方式
date: 2020-06-12
tags:
 - Java
categories:
 - 知海拾贝
---

:::tip
在增加了连接池功能后，SORM简易框架的学习快到尾声。这时需要整理项目结构，清除掉之前为了测试而临时写的一些类和包。这时前面搁置的一个关于获取项目资源方式问题就需要解决了。
:::
<!-- more -->

项目的结构如下：
```
MYORM
├── out
│   └── production
│       └── MYORM   //编译后项目的ClassPath
│           ├── po
│           │   ├── Dept.class
│           │   └── Emp.class
│           └── sorm
│               ├── bean
│               │   ├── ColumnInfo.class
│               │   ├── Configuration.class
│               │   ├── JavaFieldGetSet.class
│               │   └── TableInfo.class
│               ├── core
│               │   ├── Callback.class
│               │   ├── DBManager.class
│               │   ├── MySqlQuery.class
│               │   ├── MySqlTypeConverter.class
│               │   ├── Query$1.class
│               │   ├── Query$2.class
│               │   ├── Query.class
│               │   ├── QueryFactory.class
│               │   ├── TableContext.class
│               │   └── TypeConverter.class
│               ├── db.properties   //要加载的资源文件
│               ├── pool
│               │   └── DBConnPool.class
│               └── utils
│                   ├── JavaFileUtils.class
│                   ├── JDBCUtils.class
│                   ├── ReflectUtils.class
│                   └── StringUtil.class
└── src
    ├── po  //根据测试数据库生成的Javabean，需要删除
    │   ├── Dept.java
    │   └── Emp.java
    └── sorm
        ├── bean
        │   ├── ColumnInfo.java
        │   ├── Configuration.java
        │   ├── JavaFieldGetSet.java
        │   └── TableInfo.java
        ├── core
        │   ├── Callback.java
        │   ├── DBManager.java
        │   ├── MySqlQuery.java
        │   ├── MySqlTypeConverter.java
        │   ├── QueryFactory.java
        │   ├── Query.java
        │   ├── TableContext.java
        │   └── TypeConverter.java
        ├── db.properties
        ├── pool
        │   └── DBConnPool.java
        └── utils
            ├── JavaFileUtils.java
            ├── JDBCUtils.java
            ├── ReflectUtils.java
            └── StringUtil.java
```
资源文件`db.properties`存放在sorm包中，之前一直都是在sorm包下建一个空类Main，使用：
```java
properties.load(Main.class.getResourceAsStream("db.properties"));
```
来将配置加载到Properties对象中。然而专门使用一个类来标记包内的资源文件是没有必要的。下面给出我了解到的两种获取项目资源文件的方法。

## 使用类对象
类对象可直接由类名或类的实例得到，以MySqlQuery为例：
```java
URL url1 = MySqlQuery.class.getResource("1.txt");

MySqlQuery query = QueryFactory.createQuery();
URL url2 = query.getClass().getResource("1.txt");
```
使用类对象的getResource()方法得到的是一个java.net.URL对象，可以进一步调用openStream()和getFile()等方法。

值得注意的是调用类对象的`getResource(String path)`方法传入的路径，如果不以斜线`/`开头则使用的相对路径为该类所在的包；如果以斜线`/`开头则使用的相对路径为项目编译后的ClassPath即`out/production/ProjectName`，与源文件src下的包结构对应。
```java
//该类的包路径
URL url1 = MySqlQuery.class.getResource("");
//打印url1的结果 file:/C:/Users/Wallace/IdeaProjects/MYORM/out/production/MYORM/core/

//该类包下的一个文件（文件不存在）
URL url2 = MySqlQuery.class.getResource("db.properties");
//打印url2的结果 file:/C:/Users/Wallace/IdeaProjects/MYORM/out/production/MYORM/core/db.properties

//项目ClassPath下的资源文件
URL url3 = MySqlQuery.class.getResource("/sorm/db.properties");
//打印url3的结果 file:/C:/Users/Wallace/IdeaProjects/MYORM/out/production/MYORM/sorm/db.properties
```

## 使用类加载器

```java
//类加载器对象也可以由类对象得到： query.getClass().getClassLoader();
URL url4 = Thread.currentThread().getContextClassLoader().getResource("sorm/db.properties");
//打印url4的结果 file:/C:/Users/Wallace/IdeaProjects/MYORM/out/production/MYORM/sorm/db.properties
```
使用类加载器的getResource()方法时和使用类对象的getResource()方法时传入的Path有所不同，**不能**以斜线`/`开头，默认就是从ClassPath根下获取。如果以斜线开头，则返回的是Bootstrap ClassLoader的加载范围，为`null`。

***
类对象和类加载器对象都提供了`getResource()`和`getResourceAsStream()`方法，不论是使用类对象还是使用类加载器，`getResourceAsStream()`和`getResource().openStream()`是等效的，都是将资源作为输入流来进行访问。以文件为输入流读取的是文件的内容，以文件夹为输入流读取的是文件夹中所有的文件(夹)名。