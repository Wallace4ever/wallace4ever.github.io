---
title: SSM框架开发学习笔记-Spring MVC部分
date: 2020-06-15
tags:
 - SSM
categories:
 - 自学项目
---
:::tip
前面学习的手写简易ORM框架的课程让我对对象关系映射有了进一步的理解，接下来学习JavaEE开发中非常典型的SSM框架（Spring MVC、Spring、Mybatis）。
:::
<!-- more -->

## MVC设计模式与SpringMVC
本科阶段的JavaEE课程中使用JSP+Servlet+Javabean的开发模式一般为：
```
1.设计数据库的表结构【实体层，不可见】
2.构建POJO：模型Bean【数据访问层DAL】（Model）
3.构建UserDAO：逻辑Bean，处理所有的JDBC操作【数据访问层DAL】（Model）
4.编写Servlet：处理客户端的请求【业务逻辑层BLL+界面层UI】（Controller）
5.编写Jsp：获得用户请求、显示反馈结果【界面层UI】（View）
```

而SpringMVC这一前端框架的功能主要在于：
```
* 简化跳转过程的开发: 1客户端请求----2服务器端响应请求----3客户端反馈信息
* 简化数据的传递处理：
  1->2 :服务器端要获得客户端提交的数据
        //以前需要使用request.getParameter()
        现在只需要通过数据绑定
  2->3 :需要将反馈信息传给客户端,并显示
        使用EL表达式+JSTL标签
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
修改在webapp/web-inf下的web.xml，resources目录下的spring-servlet.xml和整个项目的pom.xml。修改完pom.xml中的peoperties和dependencies后maven会提示导入修改后添加的依赖。

### web.xml配置
```xml
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee
         http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
         version="3.1">

  <display-name>Archetype Created Web Application</display-name>

  <welcome-file-list>
    <!--这里从上到下按优先级存放的默认的访问页面-->
    <welcome-file>index.jsp</welcome-file>
  </welcome-file-list>

  <servlet>
    <servlet-name>spring</servlet-name>
    <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
    <init-param>
      <!--读取该配置文件以生成DispatcherServlet的一个实例-->
      <param-name>contextConfigLocation</param-name>
      <param-value>classpath:spring-servlet.xml</param-value>
    </init-param>
  </servlet>

  <servlet-mapping>
    <!--对所有地址（/）的request都会使用名为spring的Servlet-->
    <servlet-name>spring</servlet-name>
    <url-pattern>/</url-pattern>
  </servlet-mapping>
</web-app>
```

### spring-servlet.xml配置
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:mvc="http://www.springframework.org/schema/mvc"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans-3.0.xsd
       http://www.springframework.org/schema/context
       http://www.springframework.org/schema/context/spring-context-3.0.xsd
       http://www.springframework.org/schema/aop
       http://www.springframework.org/schema/aop/spring-aop.xsd
       http://www.springframework.org/schema/mvc
       http://www.springframework.org/schema/mvc/spring-mvc.xsd
       http://www.springframework.org/schema/tx
       http://www.springframework.org/schema/tx/spring-tx.sxd">

    <!--使用Annotation注解-->
    <context:annotation-config/>
    <!--配置扫描包，扫描所有被Controller注解的类-->
    <context:component-scan base-package = "controller">
        <context:include-filter type="annotation" expression="org.springframework.stereotype.Controller"/>
    </context:component-scan>
    <!--注册HandlerMapper、HandlerAdapter两个映射类-->
    <mvc:annotation-driven/>
    <!--访问静态资源-->
    <mvc:default-servlet-handler/>

    <!--配置视图解析器，指明项目的jsp页面要放在webapp下views目录下的*.jsp文件中-->
    <bean class = "org.springframework.web.servlet.view.InternalResourceViewResolver">
        <property name = "prefix" value = "/views/" />
        <property name = "suffix" value = ".jsp" />
    </bean>

</beans>
```

### pom.xml配置
pom配置中包含了项目的基本信息，所需依赖和maven构建时用到的信息。
```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <!--基本信息-->
  <groupId>edu.seu</groupId>
  <artifactId>mvcLearn01</artifactId>
  <version>1.0-SNAPSHOT</version>
  <packaging>war</packaging>

  <name>mvcLearn01 Maven Webapp</name>
  <url>http://www.example.com</url>

  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>1.7</maven.compiler.source>
    <maven.compiler.target>1.7</maven.compiler.target>
    <springMVC_version>5.2.6.RELEASE</springMVC_version>
  </properties>

  <!--定义了该项目使用的所有依赖的jar包-->
  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.11</version>
      <scope>test</scope>
    </dependency>

    <!-- https://mvnrepository.com/artifact/javax.servlet/javax.servlet-api -->
    <dependency>
      <groupId>javax.servlet</groupId>
      <artifactId>javax.servlet-api</artifactId>
      <version>4.0.1</version>
      <scope>provided</scope>
    </dependency>

    <!--更多依赖-->
  </dependencies>

  <build>
    <!--maven构建时用到的信息-->
  </build>
```

## 使用SpringMVC进行跳转
### 传统JSP+Servlet+Javabean的处理过程
在这之前，我们先来看看传统JSP+Servlet+Javabean的处理过程，后面与SpringMVC的处理过程进行比较。
```
客户端->服务器->客户端

客户端：显示页面，获得用户的request并发送给服务器指定的url
服务器：Servlet
    1. 如果request有参数（通常form都有参数），就需要通过request.getParameter()获得参数的值。如有必要还要逐一进行封装到pojo/Javabean中，工作量很大并且重复性很高。
    2. 调用DAO，对数据库进行操作，每一次操作都要建立连接->生成并执行SQL语句->封装结果->断开连接。（较为复杂，ORM框架就是为了简化这一过程）。
    3. 将反馈信息放在response容器中
    4. 跳转
客户端：显示信息
    1. 从response中取出信息
    2. 用jsp或者表达式显示信息
```
该种方法令人讨厌的地方在于：
```
1. 对于每一种请求，都要有独立的Servlet来相应请求，会在web.xml中创建很多的Servlet和Servlet-mapping。
2. Servlet中：
    1. 读取每一个参数并且转换类型
    2. 封装到pojo中
    3. DAO方法：insert需要根据pojo对象的属性生成相应的SQL语句，get需要将得到的查询记录封装成pojo对象，等等……在对象属性较多时会比较繁杂。
    4. 跳转：每次跳转只有打开servlet后才能知道该次访问去向何方
```
框架的出现解决了上面的痛点。SpringMVC是一个前端框架，解决了2.1、2.2的工作；MyBatis是持久层框架，解决了2.3的工作，使得开发者操作数据库只需要提供SQL语句就可以了；Spring框架目前可以理解成一个粘合剂把两者组织到一起。

使用框架，是为了解决程序员非常讨厌的重复的机械的操作，让程序员尽可能把精力都放在需要思考的逻辑上，从机械工作中解脱出来提高工作效率。软件公司的成本主要是人力成本，编程效率提高了，成本自然降低，生产效率和利润也就提高了。

### 使用SpringMVC的跳转流程

Controller类：控制层，一个模块只需要一个Controller，相当于Servlet集合。以用户增删改查为例：

在controller包下新建UserController类，用注解将该类注解为@Controller（org.springframework.stereotype.Controller），并分别为该类和该类下某个处理方法添加@RequestMapping注解。下面的UserController.insert()效果等同于单个Servlet中的service()方法，处理的请求地址为`http://hostname:8080/mvc001/user/add`。
```java
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller
@RequestMapping("/user")
public class UserController {
    @RequestMapping("/add")
    public ModelAndView insert() {
        //封装了Request功能
        ModelAndView mv = new ModelAndView();
        System.out.println("正在访问UserController.insert()，用于添加用户信息");

        //指定跳转到的页面
        mv.setViewName("User_show");
        return mv;
    }
}
```
要请求该方法处理，html表单中的url为`../user/add`
```html
<form action="../user/add" method="post">
    <input type="submit" value="添加用户">
</form>
```
该过程中请求的处理流程为：
User_add.jsp中的表单发出post请求->请求被web服务器接收并封装 -> 按照web.xml中的Servlet-mapping被`org.springframework.web.servlet.DispatcherServlet`按照spring-servlet.xml中的配置来处理 -> 按照请求的url根据Request-mapping使用UserController.insert()来处理 -> 指定跳转的页面为User_show（按照spring-servlet.xml中配置的视图解析器被解析为/views/User_show.jsp）

### 练习: 图书管理增删改查模块间的跳转

## 使用SpringMVC进行数据传递：数据绑定
从客户端到服务器进行参数传递时，常需要绑定的数据类型有：
1. 基本数据类型的绑定
2. 包装数据类型的绑定
3. POJO (实体类)类型的绑定
4. 复合POJO (实体类)类型的绑定
5. 数组类型的绑定

***
***未完待续***