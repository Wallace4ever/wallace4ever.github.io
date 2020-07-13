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

## 认识Spring Bean
**Bean是一个被实例化、组装并通过IOC容器所管理的对象。**通过IOC容器所提供的配置元数据提供。

### 配置元数据的属性
Bean的定义包含了：类的定义+配置元数据的信息（可以通过xml或注解）

我们在applicationContext.xml中配置Bean的元数据信息时需要配置一些属性：
|属性|描述|
|--|--|
|class|这个属性是强制性的，并且指定用来创建bean的bean类。|
|name/id|这个属性指定唯-的bean标识符。在基于XML的配置元数据中，你可以使用ID和/或name属性来指定bean标识符。|
|scope|这个属性指定由特定的bean定义创建的对象的作用域，它将会在bean作用域的小节中进行讨论。|
|constructor-arg|它是用来注入依赖关系的，并会在接下来的小节中进行讨论。|
|properties|它是用来注入依赖关系的，并会在接下来的小节中进行讨论。|
|autowiring mode|它是用来注入依赖关系的，并会在接下来的小节中进行讨论。|
|lazy-initialization mode|**延迟初始化**的bean告诉loC容器在它第一次被请求时，而不是在启动时去创建-H个bean实例。|
|init-method|在bean的所有必需的属性被容器设置之后，调用回调方法。它将会在bean的生命周期小节中进行讨论。|
|destroy-method|当包含该bean的容器被销毁时，使用回调方法。它将会在bean的生命周期小节中进行讨论。|

### Bean和Spring容器的关系
IOC容器初始化时会有以下操作
1. 读取请求的Bean的配置信息，确定其是哪个类的对象、生命周期和初始化参数等信息。
2. 根据容器中Bean的注册表（索引）去实例化对象
3. 将初始化完毕的对象放在容器中Bean缓存中管理。
当有一个应用请求获取Bean时，就从容器中取出Bean以供使用

### Spring Bean作用域：scope
Bean的作用域默认为singleton，共有以下几种：
|作用域|说明|
|--|--|
|singleton|在spring IoC容器仅存在一 个Bean实例, Bean以单例方式存在,默认值|
|prototype|每次从容器中调用Bean时,都返回一个新的实例，即每次调用getBean()时,相当于执行newXxxxBean()|
|request|每次HTTP请求都会创建一 个新的Bean ,该作用域仅适用于用于WebApplicationContext环境- ----- -次会话|
|session|同一个HTTP Session共享一个Bean ,不同Session使用不同的Bean ,仅适用于WebApplicationContext环境----- 一次会话|
|global-session|一般用于Portlet应用环境,该运用域仅适用于WebApplicationContext环境-----application|
默认情况下，Bean是单例的，在IOC容器初始化的时候就创建了Bean，每次使用共享同一个对象。在定义为prototype时，容器初始化时就不会创建Bean，只在要使用的时候创建对象。对于有状态的Bean我们使用prototype，一般对于无状态的Bean我们就使用singleton。

### Bean的生命周期
Bean的定义->Bean的初始化->Bean的使用->Bean的销毁

开发者可以在Bean类中编写自定义初始化方法和销毁前执行的方法，并在Bean配置中通过init-method属性和destroy-method属性注册这两种方法。
```xml
<bean id="b3" class="edu.seu.pojo.Book" init-method="init" destroy-method="destroy"/>
```
init方法在创建时就会执行，但由于IOC容器的机制destroy方法并不一定会立即执行（无论是singleton或是prototype），可以通过`((ClassPathXmlApplicationContext)ac).registerShutdownHook();`来销毁对象。

我们可以约定好Bean类中编写的相应方法名，就可以在Beans标签中对所有的Bean统一配置默认的方法。
```xml
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd"
       default-init-method="init" default-destroy-method="destroy">

       <bean id="b1" class="edu.seu.pojo.Book"/>
       <bean id="b2" class="edu.seu.pojo.Book" scope="prototype"//>
</beans>
```

## Bean的依赖关系
****
**未完待续**