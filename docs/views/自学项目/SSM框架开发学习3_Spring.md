---
title: SSM框架开发学习笔记-Spring部分
date: 2020-07-12
tags:
 - SSM
categories:
 - 自学项目
---
:::tip
今天开始正式入门Spring。
:::
<!-- more -->

## 认识Spring
Spring是一个轻量级的、可用于开发**任何Java应用程序**的企业级开发框架，通过基于POJO编程模型来促进良好的编程实践，创建性能好、易于测试、可重用的代码。

**使用Spring框架的好处**
1. 非侵入式（non-invasive）设计：可以使应用程序代码对框架依赖最小化。
2. 方便解耦、简化开发：Spring就是一个大工厂，可以将所有对象的创建和依赖关系的维护工作都交给Spring容器的管理，大大降低了组件之间的耦合性。（IoC）
3. 支持AOP：允许将一些通用任务、如安全，事务、日志等进行集中式处理，从而提高程序的可复用性。
4. 支持声明式事务处理：只需要通过配置就可以完成对事物的管理，而无需手动编程。
5. 方便程序的测试：提供了对Junit4的支持，可以通过注解方便地测试Spring程序。
6. 方便集成各种优秀框架：其内部提供了对Hibernate、MyBatis、Quartz等框架的直接支持。
7. 降低了JavaEE API的使用难度：对JDBC、Java Mail等都提供了封装，使这些API应用难度大大降低。

我们在MVC框架中使用Spring，并不是为了解决MVC中某个具体的问题，而是为了优化开发与管理，其功能更多体现在控制层与模型层。

## Spring 体系结构
[Spring 体系结构](https://www.w3cschool.cn/wkspring/dcu91icn.html)

## 搭建环境
1. 仍然是新建一个空白Maven项目，在pom文件中加入本项目需要的spring依赖；
2. 在资源目录下新建spring配置文件applicationContext.xml；
3. 编写相应的pojo之后在applicationContext.xml注册bean；
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

    <!--
    注册bean，对象名=id
    -->
    <bean id="b1" class="edu.seu.pojo.Book"/>
</beans>
```
就可以编写测试程序了:
```java
    @Test
    public void test1() {
        //获得容器，有三种途径
        ApplicationContext ac= new ClassPathXmlApplicationContext("applicationContext.xml");
        //取出对象
        Book b1=(Book) ac.getBean("b1");
        System.out.println(b1);
    }
```
这样，我们就从Spring容器中取出了我们的pojo对象，而不需要我们手动创建和管理了。

****
**未完待续**