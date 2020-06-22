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
4.编写Servlet：处理客户端的请求【业务逻辑层BLL】（Controller）
5.编写Jsp：获得用户请求、显示反馈结果【界面层UI】（View）
```

而SpringMVC这一前端框架的功能主要在于：
```
* 简化跳转过程的开发: 1客户端请求----2服务器端响应请求----3客户端反馈信息
* 简化数据的传递处理：
  1:客户端请求：form、url
    //以前按照servlet-mapping请求对应servlet中的service()
    现在通过Controller/method
  2:服务端处理请求：
    1）服务器端要获得客户端提交的数据
      //以前需要使用request.getParameter()
      现在只需要通过数据绑定
    2）处理请求，可以结合Mybatis数据库操作
    3）得到结果并跳转
  3:将反馈信息传给客户端,并显示
    1）取出信息
      //以前通过request
      现在通过EL表达式
    2）显示信息
      //以前通过jsp标签
      现在使用EL表达式+JSTL标签
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
为了美观大方任意使用一个带样式的前端模版，修改增删改查相应的jsp文件（增：Book_add.jsp，显示增加的书籍：Book_show.jsp； 分页查+删除：Book_list.jsp()，显示删除的结果：message.jsp；单独查：Book_search.jsp）。并建立BookController类，注解@Controller与@RequestMapping到对应的方法，在jsp表单中action和超链接中填入对应的请求地址以实现跳转。

确保jsp文件头有下面的代码：
```html
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
  String path=request.getContextPath();
  String basePath=request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
%>
```
第一行是声明字符编码，后者是为了避免客户端访问RequestMapping的地址同时又使用相对路径来访问资源可能造成的资源获取不到的问题。要想确保资源文件路径正确，可使用ContextPath拼接协议、主机、端口来得到资源的绝对路径：
```html
<!-- 即http://localhost:8080/mvc001/views/js/jquery.js -->
<script src="<%=basePath%>views/js/jquery.js"></script>
```
**绝对路径解释：**

例如IDEA项目名为`mvclearn01`，编译生成的war exploded目录结构为：

![war-exploded.png](https://wx1.sbimg.cn/2020/06/20/war-exploded.png)

上面的`request.getContextPath()`是在开发Web项目时经常用到的方法，可返回`web项目的根路径名`。在部署时设置项目在Tomcat中的Application Context为`“mvc001”`，则`request.getContextPath()`的结果为`“/mvc001”`，对应的是项目编译后输出的`/mvclearn01`目录。

相对应地，`http://localhost:8080/mvc001`是项目部署的basePath，其中除了META-INF和WEB-INF不能直接访问之外，剩下的都对应源代码中webapp下开发者创建的结构，可以通过绝对路径访问。

下面的两个绝对路径是等价的：

`http://localhost:8080/mvc001`+`/views/Book_add.jsp`

`http://localhost:8080/mvc001`+`/book/addBook`

前者也经过了RequestMapping但是没有匹配的方法，所以直接请求jsp得到其中包含的html（如果把某方法的RequestMapping配置成`/Book_add.jsp`并请求`/book/Book_add.jsp`其实也会报404而不会调该方法，所以不要把方法的RequestMapping命名为`XX.jsp`这样有歧义的名字）；

后者是被springMVC通过RequestMapping映射到了BookController.add()，只不过该方法目前没有对请求作进一步处理，仅仅是将返回的view设为了Book_add.jsp（发生了一次请求转发或者说服务器端跳转，浏览器地址栏仍然是/book/addBook，但实际拿到的html是Book_add.jsp返回的）。

我们目前编写的jsp,css,js等文件都在views目录下，所以使用绝对路径（形如basePath+/views/XXX.jsp或basePath+/views/js/jquery.js）是最稳妥的方案。

**相对路径解释：**

:::warning
资源的相对路径是浏览器作客户端跳转时基于当前的网页地址推断出来的，和开发时的项目组织结构没有必然的联系！
:::

以上面的两个绝对路径为例，分别访问它们，响应的都是相同的html内容，假设其中包含了：
```html
<script src="js/jquery.js"></script>
```
对于前一个路径`http://localhost:8080/mvc001/views/Book_add.jsp`，浏览器推断/Book_add.jsp是当前资源，/views是资源所在目录，则该js文件的真实路径为（没有问题，可以正常获取）：

![1.png](https://wx2.sbimg.cn/2020/06/20/1.png)

对于后一个路径`http://localhost:8080/mvc001/book/addBook`，浏览器推断/book是资源所在目录，因而得出该js文件的真实路径为：

![2.png](https://wx2.sbimg.cn/2020/06/20/2.png)

而/book并不是项目下真实存在的目录，只是我们为BookController注册的RequestMapping，所以资源会获取失败。其实对于通过RequestMapping的访问方式并不是不能使用相对路径，可以修改为下面相对路径来实现资源的获取。

和UNIX文件系统中的表示相同，`../views/js/jquery.js`表示当前目录（/book）的上层目录（/mvc001）下的`/views/js/jquery.js`资源。
```html
<script src="../views/js/jquery.js"></script>
```
![3.png](https://wx2.sbimg.cn/2020/06/20/3.png)

尽管可以在修改后用相对路径访问到目标资源，但如果开发中同时存在上面访问资源的两种方式，尽量还是使用绝对路径以免混淆。

另外，`./js/jquery.js`等价于`js/jquery.js`，`/js/jquery.js`表示从web服务器根目录开始`http://localhost:8080/js/jquery.js`。要注意区分它们的区别。

## 使用SpringMVC进行数据传递：数据绑定
从客户端到服务器进行参数传递时，常需要绑定的数据类型有：
1. 基本数据类型的绑定
2. 包装数据类型的绑定
3. POJO (实体类)类型的绑定
4. 复合POJO (实体类)类型的绑定
5. 数组类型的绑定

### 基本数据类型的绑定
要从表单中获取各种基本数据类型，只需要：
1. 将参数放在Controller执行方法的参数列表中
2. 保证数据类型兼容，同时参数名与表单中对应项的name保持一致
```java
@Controller
@RequestMapping("/data")
public class DataController {
    @RequestMapping("/test1")
    //要获得基本数据类型，只需要将其作为处理方法的参数
    public ModelAndView test1(int n,double d,char ch,boolean b) {
        System.out.println("Integer is "+n);
        System.out.println("Double is "+d);
        System.out.println("Char is "+ch);
        System.out.println("Boolean is "+b);
        ModelAndView mv=new ModelAndView();
        mv.setViewName("data/hello");
        return mv;
    }
}
```

### 包装数据类型的绑定
springMVC提供了自动的数据类型转换，String -> 基本数据类型：

`<input type="text" value="10" name="n">` -> int n = 10;

但是如果得到的String值是错误的，如空串和其他格式错误值，就会引发数据类型的转换错误。

例如，在上面的Controller执行方法中，表单封装在post请求中的参数可以涵盖并超过该方法的参数，但是一旦执行方法的参数在请求中找不到，就会尝试将其转为null。然而基本类型不可以转为null，只有引用类型才可以。这时就会引发500服务器内部错误。

针对格式错误的问题，可以在客户端使用js检查用户输入是否正确，也可以采用包装类型避免该错误。
```java
    @RequestMapping("/test2")
    public ModelAndView test2(Integer n,Double d,Character ch,Boolean b,String s) {
        System.out.println("Integer is "+n);
        System.out.println("Double is "+d);
        System.out.println("Char is "+ch);
        System.out.println("Boolean is "+b);
        System.out.println("String is "+s);
        ModelAndView mv=new ModelAndView();
        mv.setViewName("data/hello");
        return mv;
    }
```
在输入为空值时，客户端和服务器都不会报错，控制台输出：
```
Integer is null
Double is null
Char is null
Boolean is null
String is 
```
在输入格式错误的值时，服务器抛出MethodArgumentTypeMismatchException，客户端收到http400错误的请求。

### POJO（实体类）的绑定
没有逻辑关系的数据，可以通过基本数据类型或者包装数据类型获取。但对于有逻辑关系的数据，就需要将其封装到一个pojo中。

在之前学习Servlet时，开发者每次需要手动获得数据的值，并封装到对象。而SpringMVC提供了相应的解决方案。

首先建立pojo类，例如User类，封装以下属性并添加get/set方法。
```java
private String name;
private String pwd;
private int age;
private double height;
```
接下来在对应的表单中提交对应的值。注意表单中的变量名要和User类的属性名相同，表单提交的数据类型也要能匹配User类的对应属性类型。
```html
<form method="post" action="<%=basePath%>user/addUser">
    <p>用户名：<input type="text"  name="name"></p>
    <p>密码：<input type="text"  name="pwd"></p>
    <p>年龄：<input type="text"  name="age"></p>
    <p>身高：<input type="text"  name="height"></p>
    <p><input type="submit" value="提交"></p>
</form>
```
在Controller执行方法的参数中传入该User对象即可直接使用，SpringMVC已经完成了获取值并封装到对象的过程。
```java
@RequestMapping("addUser")
public ModelAndView add(User user) {
    System.out.println(user);
    ModelAndView mv=new ModelAndView();
    mv.setViewName("data/hello");
    return mv;
}
```

### 复合POJO类型的绑定
考虑一个一对多的关系：学籍管理——Classes->Student，创建对应的类并添加get/set方法，重写toString方法。
```
Classes:                Student:
name                    name
count                   sex
year                    age
dept                    number
                        birthday
                        Classes cl
```
在表单中注册学生这一复合pojo时，除了基本的属性，还需要通过`对象名.属性名`来输入学生持有的cl对象的属性：
```html
<input type="text" class="input" name="cl.name" value="" />
```
全部输入后，后端就能在参数中直接使用Student对象：
Student{name='lisi', sex='男', age=18, num='231231', cl=Classes{name='一班', count=34, year=2018, dept='计算机'}}

### 数组类型的绑定
Student类新增一个属性`private String[] hobby;`与相应的get/set方法，对应的html中需要增加一个checkBox多选按钮。
```html
<div class="field">
  <input type="checkbox"  name="hobby" value="骑马" />骑马
  <input type="checkbox"  name="hobby" value="弹琴" />弹琴
  <input type="checkbox"  name="hobby" value="乒乓球" />乒乓球
  <input type="checkbox"  name="hobby" value="篮球" />篮球
</div>
```
保持表单中checkbox与pojo属性中数组名一致即可。

### 数据类型绑定中的一些注意点
* 尽管在jsp头部声明了`charset=utf-8`可以让浏览器以UTF-8来解码，但在浏览器中提交数据时仍服务端若不设置解码格式则也会出现中文乱码，为此在web.xml中统一使用过滤器：
  ```xml
  <!--配置编码方式过滤器，注意要配置在所有过滤器前面-->
  <filter>
    <filter-name>CharacterEncodingFilter</filter-name>
    <filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
    <init-param>
      <param-name>encoding</param-name>
      <param-value>utf-8</param-value>
    </init-param>
  </filter>

  <filter-mapping>
    <filter-name>CharacterEncodingFilter</filter-name>
    <url-pattern>/*</url-pattern>
  </filter-mapping>
  ```
* 来自前端请求中的属性，可以自动封装在pojo对象中获取，也可以直接在参数中指定获取：
  ```java
  @RequestMapping("/add")
  public ModelAndView addStudent(Student student,String[] hobby) {
      System.out.println(student);
      System.out.println("hobby"+ Arrays.toString(hobby));
      ModelAndView mv=new ModelAndView();
      mv.setViewName("/data/hello");
      return mv;
  }
  ```
* Date类型的绑定：由于SpringMVC没有提供Date类型的自动绑定，所以需要我们自己定义由String类型到Date类型的转换器：
  ```java
  package util;
  import java.text.ParseException;
  import java.text.SimpleDateFormat;
  import java.util.Date;
  import org.springframework.core.convert.converter.Converter;

  //需要实现Converter接口，这里是将String类型转换成Date类型
  public class DateConverter implements Converter<String, Date> {
      @Override
      public Date convert(String source) {
          //实现将字符串转成日期类型(格式是yyyy-MM-dd HH:mm:ss)
          SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
          try {
              return dateFormat.parse(source);
          } catch (ParseException e) {
              e.printStackTrace();
          }
          //如果参数绑定失败返回null
          return null;
      }
  }
  ```
  接下来在spring-servlet.xml中注册该配置转换器的conversion-service：
  ```xml
  <mvc:annotation-driven conversion-service="conversionService"/>

  <bean id="conversionService" class="org.springframework.format.support.FormattingConversionServiceFactoryBean">
      <property name="converters">
          <!-- 自定义转换器的类名 -->
          <bean class="util.DateConverter"/>
      </property>
  </bean>
  ```
  现在，在前端提交的birthday属性，如果格式与转换器内设置的日期类型一致就可以正确转为Date类型。某些特殊的类型转换也可以使用这种方式实现自定义转换。

## EL表达式
表达式是一种有结果的算式（常量、变量），EL（Expression Language）表达式语言，可以简化对变量对象的访问。以前为了在返回的html中显示特定结果，需要使用jsp表达式`<%=%>`，还是没有做到彻底地将逻辑和显示分开。

EL表达式用于以下情形
* 静态文本
* 标准标签和自定义标签
* EL不能在脚本元素中使用

### EL表达式语言的语法
* `${EL Expression}`所有的表达式以`${`开始,以`}`结束。

#### 访问常量
```html
<h1>常量</h1>
<br>整数：${10}
<br>小数：${10.3}
<br>char：${'W'}
<br>bool：${true}
<br>字符串：${"hello"}
```
#### 算数运算
EL表达式中除的结果为实数
```html
<h1>算数运算</h1>
<br>12+3=${12+3}
<br>12-3=${12-3}
<br>12*3=${12*3}
<br>12/3=${12/3}
<br>12%3=${12%3}
```
#### 关系运算与逻辑运算
EL表达式同样支持`= != < > <= >=`这几种关系运算和`&& || !`这几种逻辑运算。

注意:在使用EL关系运算符时,不能够写成：
```
${param.password1} = = ${param.password2}或者
${ ${param.password1 }= = ${ param.password2 } }
```
而应写成：
```
${ param.password1 = = param.password2 }
```
逻辑运算示例：`${(12= =3)&&(12!=3)}`

#### 变量
EL在对表达式中的变量进行操作的时候，它通过`pageContext.findAttribute()`的方式来查找变量,依次从`page,request,session,application`域(容器)中开始查找,如果这几个范围都没有找到则返回`null` ,也可以指定在特定的域中查找。Application容器是公共容器，慎重使用。

| 属性范围 | 在EL中的名称 | 作用范围 |
|:-:|:-:|:-:|
|Page|PageScope|页面中有效|
|Request|RequestScope|一次访问有效|
|Session|SessionScope|一次会话有效|
|Application|ApplicationScope|一次项目启动有效

使用EL表达式替代jsp表达式的取值示例（page容器中放数据没太大意义servlet API 4.0之后就不支持）：
```html
<h1>从不同的容器中取出数据</h1>
<%
    request.setAttribute("s1","hello request");
    session.setAttribute("s2","hello session");
    application.setAttribute("s3","hello application");
%>
<br>从request中取出变量：<br>
${requestScope.s1} ||| <%=request.getAttribute("s1")%>
<br>从session中取出变量：<br>
${sessionScope.s2} ||| <%=session.getAttribute("s2")%>
<br>从application中取出变量：<br>
${applicationScope.s3} ||| <%=application.getAttribute("s3")%>
```
如果三个容器中存在同名变量`s`，而访问的时候不指明在哪个容器中取值`${s}`，则取值的顺序如下：page,request,session,application，都没有找到则不显示。


***
***未完待续***