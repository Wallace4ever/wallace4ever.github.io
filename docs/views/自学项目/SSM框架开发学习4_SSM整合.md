---
title: SSM框架开发学习笔记-SSM整合实战
date: 2020-07-21
tags:
 - SSM
categories:
 - 自学项目
---
:::tip
在前面初步入门了Spring、Spring MVC和MyBatis的基础上，整合一个完整可运行的项目。后面还需要深入了解各组件的原理并在学习了Redis之后结合起来使用。
:::
<!-- more -->

## 环境配置
### 配置流程
首先依然是基于Maven创建一个webapp项目，不过这次需要引入的依赖比较多，Spring各组件、Spring、MyBatis、JDBC驱动、servlet-api、jsp-api、junit、log4j等等。
然后创建java目录和resources目录并将数据库连接、Mybatis、Spring配置文件配置到resources目录。
最后配置web.xml后启动tomcat进行测试。

### 配置文件解读
首先从web.xml入手，web服务器启动该项目后首先读取的就是该配置。其中主要配置内容和加载顺序如下：
1. 浏览器标题和欢迎页
2. 通过context-param标签配置web项目的Spring上下文配置文件所在路径contextConfigLocation（param-name和param-value会转为键值对交给ServletContext）
3. 根据listener标签中配置的监听器类创建监听器实例，监听器有一个contextInitialized(ServletContextEvent event)方法并可以用event.getServletContext().getInitParameter("contextConfigLocation")来得到Spring配置文件的位置并加载Spring。当然该过程不需要我们去做。
4. 根据filter标签中配置，创建spring字符编码过滤器实例。
5. 加载servlet，在Spring MVC框架下我们只需要加载一个DispatcherServlet就可以了。
:::details
```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
         version="3.1">

  <display-name>Archetype Created Web Application</display-name>
  <welcome-file-list>
    <welcome-file>index.jsp</welcome-file>
  </welcome-file-list>

  <!-- 配置spring -->
  <context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>classpath:spring/applicationContext-*.xml</param-value>
  </context-param>

  <!-- 配置监听器加载spring -->
  <listener>
    <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
  </listener>

  <!-- 配置过滤器，解决post的乱码问题 -->
  <filter>
    <filter-name>encoding</filter-name>
    <filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
    <init-param>
      <param-name>encoding</param-name>
      <param-value>UTF-8</param-value>
    </init-param>
  </filter>
  <filter-mapping>
    <filter-name>encoding</filter-name>
    <url-pattern>/*</url-pattern>
  </filter-mapping>

  <!-- 配置SpringMVC -->
  <servlet>
    <servlet-name>boot-ssm</servlet-name>
    <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
    <init-param>
      <param-name>contextConfigLocation</param-name>
      <param-value>classpath:spring/springmvc.xml</param-value>
    </init-param>
    <!-- 配置springmvc什么时候启动，参数必须为整数 -->
    <!-- 如果为0或者大于0，则springMVC随着容器启动而启动 -->
    <!-- 如果小于0，则在第一次请求进来的时候启动 -->
    <load-on-startup>1</load-on-startup>
  </servlet>
  <servlet-mapping>
    <servlet-name>boot-ssm</servlet-name>
    <!-- 所有的请求都进入springMVC -->
    <url-pattern>/</url-pattern>
  </servlet-mapping>

</web-app>
```
:::

在上面的配置中，有两处将相应配置文件告知给被加载的实例。一处是Spring MVC配置通过init-param标签将contextConfigLocation参数传递给DispatcherServlet：
```xml
    <init-param>
      <param-name>contextConfigLocation</param-name>
      <param-value>classpath:spring/springmvc.xml</param-value>
    </init-param>
```
而springmvc.xml我们并不陌生，其中配置了应该去那个包根据注解扫描Controller bean、声明Spring MVC注解驱动以及注册了视图解析器的bean：
:::details
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:p="http://www.springframework.org/schema/p"
	xmlns:context="http://www.springframework.org/schema/context"
	xmlns:mvc="http://www.springframework.org/schema/mvc"
	xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans-4.0.xsd
        http://www.springframework.org/schema/mvc http://www.springframework.org/schema/mvc/spring-mvc-4.0.xsd
        http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context-4.0.xsd">
	<!-- 配置Controller扫描 -->
	<context:component-scan base-package="edu.seu.controller" />

	<!-- 配置注解驱动 -->
	<mvc:annotation-driven />
	<mvc:default-servlet-handler />
	
	<!-- 配置视图解析器 -->
	<bean	class="org.springframework.web.servlet.view.InternalResourceViewResolver">
		<!-- 前缀 -->
		<property name="prefix" value="/views/" />
		<!-- 后缀 -->
		<property name="suffix" value=".jsp" />
	</bean>
</beans>
```
:::

而web.xml中另一处传递配置文件路径参数的地方是监听器加载时读取context-param并传递给加载的Spring容器。
```xml
  <context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>classpath:spring/applicationContext-*.xml</param-value>
  </context-param>
```
这里的Spring配置文件使用了通配符来使用多个配置文件，因为区分了不同的功能（当然配置到一个文件中也是可以的）。这些配置注册了大量我们在之前的学习中使用过的对象为bean，让Spring来为我们管理这些对象：

**1. applicationContext-dao.xml**
该文件配置了持久层相关的内容，包括数据库数据源（DriverManagerDataSource）、SqlSessionFactory（SqlSessionFactoryBean）和Mapper扫描器（MapperScannerConfigurer）都被注册为bean，这一点和我们之前直接使用SqlSessionFactoryBuilder来读取配置逐步创建SqlSession是不一样的。
:::details
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:context="http://www.springframework.org/schema/context" xmlns:p="http://www.springframework.org/schema/p"
	xmlns:aop="http://www.springframework.org/schema/aop" xmlns:tx="http://www.springframework.org/schema/tx"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans-4.0.xsd
	http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context-4.0.xsd
	http://www.springframework.org/schema/aop http://www.springframework.org/schema/aop/spring-aop-4.0.xsd http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx-4.0.xsd
	http://www.springframework.org/schema/util http://www.springframework.org/schema/util/spring-util-4.0.xsd">
<!-- 配置数据源，数据库连接池 -->
	<!-- 配置 读取properties文件 jdbc.properties -->
	<context:property-placeholder location="classpath:properties/jdbc.properties" />

	<!-- 配置 数据源 -->
	<bean id="dataSource" class="org.springframework.jdbc.datasource.DriverManagerDataSource"> 
		<property name="driverClassName" value="${jdbc.driver}" />
		<property name="url" value="${jdbc.url}" />
		<property name="username" value="${jdbc.username}" />
		<property name="password" value="${jdbc.password}" />
	</bean>

	<!-- 配置SqlSessionFactory -->
	<bean class="org.mybatis.spring.SqlSessionFactoryBean">
		<!-- 设置MyBatis核心配置文件 -->
		<property name="configLocation" value="classpath:mybatis/SqlMapConfig.xml" />
		<!-- 设置数据源 -->
		<property name="dataSource" ref="dataSource" />
	</bean>

	<!-- 配置Mapper扫描 -->
	<bean class="org.mybatis.spring.mapper.MapperScannerConfigurer">
		<!-- 设置Mapper扫描包 -->
		<property name="basePackage" value="edu.seu.mapper" />
	</bean>
</beans>
```
这里创建SqlSessionFactoryBean传入的参数SqlMapConfig.xml是MyBatis的核心配置文件，配置了POJO的扫描。
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-config.dtd">
<!-- MyBatis核心配置文件 -->
<configuration>
	<typeAliases>
		<!-- 别名 -->
		<package name="edu.seu.pojo"/>
		<!-- <typeAlias type="com.ssm.pojo.Student" alias="Student"/>-->
	</typeAliases>
</configuration>
```
:::

**2. applicationContext-service.xml**
这里配置了service层的扫描位置，用扫描注解的方式获取该包下的service bean，而将service从controller中分离出来体现了MVC分层的思想。（request->controller->service->mapper->pojo）
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:context="http://www.springframework.org/schema/context" xmlns:p="http://www.springframework.org/schema/p"
	xmlns:aop="http://www.springframework.org/schema/aop" xmlns:tx="http://www.springframework.org/schema/tx"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans-4.0.xsd
	http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context-4.0.xsd
	http://www.springframework.org/schema/aop http://www.springframework.org/schema/aop/spring-aop-4.0.xsd http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx-4.0.xsd
	http://www.springframework.org/schema/util http://www.springframework.org/schema/util/spring-util-4.0.xsd">

	<!-- 配置Service扫描 -->
	<context:component-scan base-package="edu.seu.service" />
</beans>
```

**3. applicationContext-trans.xml**
这里配置了事务管理器bean和事务通知、连接点和切面
:::details
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:context="http://www.springframework.org/schema/context" xmlns:p="http://www.springframework.org/schema/p"
	xmlns:aop="http://www.springframework.org/schema/aop" xmlns:tx="http://www.springframework.org/schema/tx"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans-4.0.xsd
	http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context-4.0.xsd
	http://www.springframework.org/schema/aop http://www.springframework.org/schema/aop/spring-aop-4.0.xsd http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx-4.0.xsd
	http://www.springframework.org/schema/util http://www.springframework.org/schema/util/spring-util-4.0.xsd">

	<!-- 事务管理器 -->
	<bean id="transactionManager"	class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
		<!-- 数据源 -->
		<property name="dataSource" ref="dataSource" />
	</bean>

	<!-- 通知 -->
	<tx:advice id="txAdvice" transaction-manager="transactionManager">
		<tx:attributes>
			<!-- 传播行为 -->
            <!-- DML，数据库要改变，需要事务 -->
			<tx:method name="save*" propagation="REQUIRED" />
			<tx:method name="insert*" propagation="REQUIRED" />
			<tx:method name="add*" propagation="REQUIRED" />
			<tx:method name="create*" propagation="REQUIRED" />
			<tx:method name="delete*" propagation="REQUIRED" />
			<tx:method name="update*" propagation="REQUIRED" />

            <!-- DQL，不需要事务 -->
			<tx:method name="find*" propagation="SUPPORTS" read-only="true" />
			<tx:method name="select*" propagation="SUPPORTS" read-only="true" />
			<tx:method name="get*" propagation="SUPPORTS" read-only="true" />
			<tx:method name="query*" propagation="SUPPORTS" read-only="true" />
		</tx:attributes>
	</tx:advice>

	<!-- 切面 -->
	<aop:config>
		<aop:advisor advice-ref="txAdvice"
			pointcut="execution(* edu.seu.service.*.*(..))" />
	</aop:config>

</beans>
```
:::

### 小结
配置结构和功能如下：
* web.xml(context-param、listener、filter)
    * Spring
        * IOC：通过配置或扫描特定包中的注解注册各种bean
            * applicationContext-dao.xml：整合MyBatis
                * SqlMapConfig.xml：MyBatis的核心配置文件，扫描pojo
                * jdbc.properties：读取数据源信息，配置DataSource bean
            * applicationContext-service.xml：扫描service包
        * AOP
            * applicationContext-trans.xml：配置数据库操作的切面，通过切面表达式扫描service包中所有类的特定方法（DML、DQL）
    * Spring MVC
        * Springmvc.xml
            * 扫描了Controller
            * 注册视图解析器bean

***
**未完待续**			