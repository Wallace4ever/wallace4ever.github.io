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

## Bean的依赖注入
我们使用Spring在Bean的配置中可以通过`<property>`标签来预先为其注入属性，name说明对哪个属性赋值，value说明要赋的值。

### 基于setter方法的属性注入
属性注入：
```xml
<bean id="cat1" class="edu.seu.pojo.Category">
    <property name="count" value="0"/>
    <property name="name" value="儿童文学"/>
    <property name="note" value="小孩子看的书"/>
</bean>
```
如果一个POJO中持有另一个POJO的引用，那么在配置好后者的Bean后，可以在前者的配置中注入对后者的依赖：
```xml
    <bean id="b4" class="edu.seu.pojo.Book">
        <property name="author" value="曹文轩"/>
        <property name="isdn" value="1131231"/>
        <property name="price" value="23.9"/>
        <property name="title" value="草房子"/>
        <!-- 使用ref而不是value来声明对已有的Bean的依赖 -->
        <property name="category" ref="cat1"/>
    </bean>
```

### 基于构造方法的属性注入
在Bean元数据配置中通过`<constructor-arg>`标签来使用构造方法注入属性，这种方式必须要和POJO已有的构造方法的参数完全匹配。
```xml
    <bean id="cat2" class="edu.seu.pojo.Category">
        <constructor-arg name="count" value="1"/>
        <constructor-arg name="name" value="历史小说"/>
        <constructor-arg name="note" value="适合成人阅读"/>
    </bean>

    <bean id="b5" class="edu.seu.pojo.Book">
        <constructor-arg name="title" value="明朝那些事"/>
        <constructor-arg name="author" value="当年明月"/>
        <constructor-arg name="isdn" value="34243"/>
        <constructor-arg name="price" value="55.5"/>
        <!-- 依赖注入 -->
        <constructor-arg name="category" ref="cat2"/>
        <!-- 或者使用type -->
        <constructor-arg type="edu.seu.pojo.Category" ref="cat3"/>
    </bean>
```

### 注入内部Bean
Java中有内部类，对应地Spring也有内部Bean。在对应的property标签内加入一个Bean就可以了，该内部Bean的id是无意义的，只能被它的外部Bean使用，而不能被其他的Bean使用。 
```xml
    <bean id="b6" class="edu.seu.pojo.Book">
        <property name="title" value="编程珠玑"/>
        <property name="price" value="90.9"/>
        <property name="isdn" value="34143123"/>
        <property name="author" value="Jon Bentley"/>
        <property name="category">
            <bean class="edu.seu.pojo.Category" id="cat3">
                <property name="note" value="适合程序员阅读"/>
                <property name="name" value="编程书籍"/>
                <property name="count" value="5"/>
            </bean>
        </property>
    </bean>
```

### 注入集合
Spring提供了4种类型的集合配置元素：
|元素|描述|
|--|--|
|`<list>`|允许重复，对应Java List接口|
|`<set>`|不允许重复，对应Java Set接口|
|`<map>`|键值对，对应Java Map接口|
|`<props>`|键值对，约束键值都是字符串|

#### List和Set
我们在Category类中添加属性`private List<Book> bookList;`与相应的get/set方法，接下来就可以在配置Bean的时候使用list标签。set标签同理，只不过不包含重复元素。
```xml
    <bean id="cat3" class="edu.seu.pojo.Category">
        <property name="count" value="0"/>
        <property name="name" value="儿童文学"/>
        <property name="note" value="小孩子看的书"/>
        <property name="bookList">
            <list>
                <ref bean="b4"/>
                <ref bean="b5"/>
                <!-- 如果是基本包装类型就使用value标签-->
            <!--<value>张三</value>-->
            </list>
        </property>
    </bean>
```
#### Map和Props
在property标签内通过map标签来添加多个entry。
```xml
    <bean id="cat4" class="edu.seu.pojo.Category">
        <property name="count" value="0"/>
        <property name="name" value="儿童文学"/>
        <property name="note" value="小孩子看的书"/>
        <property name="bookMap">
            <map>
                <entry key="1" value="小星星"/>
                <entry key="2" value="小王子"/>
                <entry key="3" value="小马过河"/>
                <!-- 自定义引用类型用key-ref和value-ref -->
            </map>
        </property>
    </bean>
```
而`<props>`标签对应的是java.util.Properties类，只支持字符串。
```xml
    <bean id="cat5" class="edu.seu.pojo.Category">
        <property name="count" value="0"/>
        <property name="name" value="儿童文学"/>
        <property name="note" value="小孩子看的书"/>
        <property name="bookProps">
            <props>
                <prop key="1">小星星</prop>
                <prop key="2">小王子</prop>
                <prop key="3">小马过河</prop>
            </props>
        </property>
    </bean>
```
#### 数组的注入
数组不属于JCF框架，可以用array和value标签来注入数组。
```xml
    <bean id="cat5" class="edu.seu.pojo.Category">
        <property name="count" value="0"/>
        <property name="name" value="儿童文学"/>
        <property name="note" value="小孩子看的书"/>
        <property name="books">
            <array>
                <value>小星星</value>
                <value>小马过河</value>
                <value>灰姑娘</value>
            </array>
        </property>
    </bean>
```

### 自动装配
默认情况下，我们需要手动为每一个Bean注入属性，在注入有大量元素的集合时就显得很不方便。我们在配置一个`<bean>`的时候可以通过显式地指明其`autowire`属性来使用自动装配。
|模式|描述|
|--|--|
|no|默认，没有自动装配|
|byName|由属性名自动装配。Spring容器看到在XML配置文件中bean的自动装配的属性设置为byName。然后尝试匹配,并且将它的属性与在配置文件中被定义为相同名称的beans的属性进行连接。|
|byType|由属性数据类型自动装配。如果Bean的类型 匹配配置文件中的一个确切的bean名称,它将尝试匹配和连接属性的类型。如果存在不止一个这样的 bean，就会抛出异常。|
|constructor|类似于byType ,但该类型适用于构造函数参数类型。如果在容器中没有一个构造函数参数类型的bean就会抛出异常|
|autodetect|Spring首先尝试通过constructor来连接，如果它不执行就尝试通过byType来自动装配|

#### byName
假设我们地Book类有如下属性并设有相应地get/set、toString方法，其中category是Category类型的属性：
```java
public class Book {
    private String title;
    private String author;
    private String isdn;
    private double price;
    private Category category;
}
```
那么我们可以首先配置一个id为`category`的Category Bean，这里的id要和POJO中的属性名相同。
```xml
    <bean id="category" class="edu.seu.pojo.Category">
        <property name="name" value="儿童文学"/>
        <property name="count" value="100"/>
        <property name="note" value="说明"/>
    </bean>
```
接下来就可以在Book Bean中使用autowire：
```xml
    <bean id="b1" class="edu.seu.pojo.Book" autowire="byName">
        <property name="author" value="冰心"/>
        <property name="isdn" value="1233424324"/>
        <property name="price" value="23.5"/>
        <property name="title" value="小读者"/>
        <!--这里我们没有显式地用value-ref连接categoty Bean-->
    </bean>
```
测试：
```java
    ApplicationContext ac;
    @Before
    public void before() {
        ac= new ClassPathXmlApplicationContext("applicationContext2.xml");
    }

    @Test
    public void test1() {
        Book book=(Book)ac.getBean("b1");
        System.out.println(book);
    }
```
在输出地结果中，可以看到该Bean地category属性已经被正确地注入了。

#### byType
与上面相似，我们将autowire设为"byType"，如果没有可匹配地Bean注入地值就为null，如果有多个同类型地Bean那么就无法自动装配。
```xml
    <bean id="b2" class="edu.seu.pojo.Book" autowire="byType">
        <property name="author" value="冰心"/>
        <property name="isdn" value="1233424324"/>
        <property name="price" value="23.5"/>
        <property name="title" value="小读者"/>
    </bean>
```
#### constructor
这种方式是通过构造方法对属性进行注入时的自动注入。如果有且仅有一个类型与当前Bean属性匹配的Bean那么就会注入（id不一定要匹配，即byType）；如果有多个类型与之匹配的Bean，那么会选择id匹配的Bean；如果有多个类型相匹配的Bean但没有其中一个Bean的id与当前Bean的属性相匹配，则无法确定要注入哪一个，会抛出异常。
```xml
    <bean id="b3" class="edu.seu.pojo.Book" autowire="constructor">
        <constructor-arg name="title" value="明朝那些事"/>
        <constructor-arg name="author" value="当年明月"/>
        <constructor-arg name="isdn" value="34243"/>
        <constructor-arg name="price" value="55.5"/>
    </bean>
```

****
**未完待续**