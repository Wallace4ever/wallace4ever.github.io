---
title: SSM框架开发学习笔记-Spring MVC部分
date: 2020-06-15
tags:
 - SSM
categories:
 - 自学项目
---
:::tip
前面学习的手写简易ORM框架的课程让我对对象关系映射有了进一步的理解，接下来学习JavaEE开发中非常典型的SSM框架（Spring MVC、Spring、Mybatis），
:::
<!-- more -->

## MVC设计模式简要回顾
本科阶段的JavaEE课程中使用JSP+Servlet+Javabean的开发模式一般为：
```
1.设计数据库的表结构【实体层，不可见】
2.构建POJO：模型Bean【数据访问层DAL】（Model）
3.构建UserDAO：逻辑Bean，处理所有的JDBC操作【数据访问层DAL】（Model）
4.编写Servlet：处理客户端的请求【业务逻辑层BLL+界面层UI】（Controller）
5.编写Jsp：获得用户请求、显示反馈结果【界面层UI】（View）
```

## 开发环境搭建
有时版本不是越高越好，稳定可运行才是最重要的。
* JDK 1.8
* Tomcat 9
* IDEA 2020
* Maven 3（IDEA内置，目前只用到了仓库功能，没有用到版本控制）
* MySQL 8

### Maven仓库简要说明
配置在用户主文件夹下的.m2/settings.xml文件（没有则从下载的Maven压缩包中拷贝）。在创建项目前需要在`<mirrors>`下添加阿里云的Maven镜像（在线仓库）否则依赖下载会比较慢，本地仓库的位置`<localRepository>`默认为`${user.home}/.m2/repository`。本地仓库保存使用过的jar包，每当新项目要用一个jar包的时候，优先搜索本地仓库，没有再去在线仓库下载。

## 创建Web项目
### 使用IDEA中的Maven模板来快速创建Web项目。
![Maven-WebAPP.png](https://wx2.sbimg.cn/2020/06/16/Maven-WebAPP.png)
该创建过程其实就是配置项目下pom.xml的groupId、artifactId、version和name等信息的过程，其余多数依赖已经自动填入pom.xml，如有需要可在后面继续添加或修改。

### 配置项目文件夹
SSM项目在src/main下有三个根目录：
1. webapp目录：用于存放所有的jsp、css、js等web资源
2. java目录：存放java源文件
3. resources目录：存放配置文件。

在新建项目后，只有webapp目录，需要手动新建剩余两个目录，并在面向IDEA在Project Structure/Modules/Sources中将这两个目录分别标记为Source Folders和Resource Folders

### 配置Tomcat
:::warning
Windows环境下，从Tomcat9.0.14版本后，tomcat在运行期间在控制台输出的中文日志会出现乱码问题，在%CATALINA_HOME%\conf\logging.properties文件中多了一项配置：

java.util.logging.ConsoleHandler.encoding = UTF-8

tomcat貌似好心办了坏事，明明想解决乱码问题，却造成了乱码问题，这是因为Windows系统控制台默认字符集是GBK，tomcat想按照UTF-8字符集输出，明显是有问题的。
解决方法有两种，一种就是将上面的配置改为GBK，另一种就是将这一项配置删去(或者在这一行最前面加#注释)。
:::

打开IDEA的run/edit configurations，配置web服务器路径。选择Template/Tomcat/local，并输入前面搭建的Tomcat服务器目录。并将`On update Action`和`On frame deactivation`都设为`Update classes and resources`以实现热部署。

接下来需要配置部署到Tomcat下的项目Artifact，选择war exploded：
![TomcatArtifact.png](https://wx2.sbimg.cn/2020/06/16/TomcatArtifact.png)

:::tip
两者的区别
* war模式：将WEB工程以包的形式上传到服务器 ；
* war exploded模式：将WEB工程以当前文件夹的位置关系上传到服务器；

war exploded模式是直接把文件夹、jsp页面 、classes等等移到Tomcat 部署文件夹里面，进行加载部署。因此这种方式支持热部署，一般在开发的时候也是用这种方式。
:::

## 认识SpringMVC 配置