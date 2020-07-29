---
title: SSM组件与原理深入学习
date: 2020-07-28
tags:
 - SSM
categories:
 - 自学项目
---
:::tip
前面的学习虽然让我对Spring MVC、Spring、MyBatis的有关概念和上手使用的方法有了一定的掌握，但是感觉没有很好地从理论层面统一起来，部分技术细节也没有涉及。此外，本阶段掌握的技术只能满足小型管理系统的开发，距离互联网系统高并发高响应的要求还有一定差距。所以接下来需要深入学习各组件开发原理，也强化对前面学习的内容的理解，并希望最终能结合Redis实现一个能支持一定规模并发量的互联网应用系统。
:::
<!-- more -->

在主流的SSM+Redis这一互联网框架中，各组件大致承担的功能如下：
* Spring IoC承担了资源管理、整合、即插即拔的功能。
* Spring AOP提供了切面管理，特别是数据库事务管理的功能。
* Spring MVC用于把模型、视图和控制器分层，组合成一个有机灵活的系统。
* MyBatis提供了访问数据库的持久层，通过MyBatis-Spring项目和Spring无缝对接。
* Redis作为缓存工具，提供了高速度处理数据和缓存数据的功能。大部分需求只需要访问缓存而无需从磁盘中反复读写。一些需要告诉运算的场合也可以先用Redis来运算再批量存入数据库，能有效提升系统的性能和响应能力。

SSM框架的很多地方都体现出了设计模式的思想，这些设计模式贯穿了开发的始终，在深入学习SSM原理之前理解它们大有裨益。

## 常用设计模式
### 动态代理模式
我们之前学习过代理模式（主要是静态代理），代理对象要实现代理功能，就必须要实现真实对象相同的接口，接下来持有一个真实对象的引用，就可以在对外提供服务时控制真实对象行为是否执行，以及添加执行前后的处理动作。Spring常用JDK自带的动态代理和CGLIB，前者必须要真实对象实现接口,后者则不需要。

创建动态代理需要两步：
1. 建立代理对象和真实对象的关系
2. 实现代理逻辑方法

这两步和静态代理并没有区别，唯一不同的是在这两步中都要使用反射技术来动态地创建代理对象和逻辑方法，因为代理对象创建前真实对象以及要调度的方法是未知的。下面是基于JDK动态代理的实现，使用`Proxy.newProxyInstance(target.getClass().getClassLoader(), target.getClass().getInterfaces(), 实例);`来创建代理对象，并且代理对象需要实现java.lang.reflect.InvocationHandler接口
```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

public class JdkProxyExample implements InvocationHandler {

	// 真实对象
	private Object target = null;

	/**
	 * 建立代理对象和真实对象的代理关系，并返回代理对象
	 * 
	 * @param target 真实对象
	 * @return 代理对象
	 */
	public Object bind(Object target) {
		this.target = target;
		return Proxy.newProxyInstance(target.getClass().getClassLoader(), target.getClass().getInterfaces(), this);
	}

	/**
	 * 代理方法逻辑
	 * 
	 * @param proxy --代理对象
	 * @param method --当前调度方法
	 * @param args --当前方法参数
	 * @return 代理结果返回
	 * @throws Throwable --异常
	 */
	@Override
	public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
		System.out.println("进入代理逻辑方法");
		System.out.println("在调度真实对象之前的服务");
		Object obj = method.invoke(target, args);// 相当于调用sayHelloWorld方法
		System.out.println("在调度真实对象之后的服务");
		return obj;
	}
}
```
测试：
```java
public static void testJdkProxy() {
    JdkProxyExample jdk = new JdkProxyExample();
    // 绑定关系，因为挂在接口HelloWorld下，所以声明代理对象HelloWorld proxy
    HelloWorld proxy = (HelloWorld) jdk.bind(new HelloWorldImpl());
    // 注意，此时HelloWorld对象已经是一个代理对象，它会进入代理的逻辑方法invoke里
    proxy.sayHelloWorld();
}
```
CGLIB在创建代理对象的过程中直接将代理对象的父类设为真实对象，所以不需要提供接口。再设置实现了代理逻辑方法的对象（该对象实现了MethodInterceptor接口）就可以创建代理对象。其代理逻辑方法中通过`Object result = methodProxy.invokeSuper(proxy, args);`来调用真实对象的方法。

设计者（例如Spring AOP设计者）还可以设计拦截器接口以避免开发者直接编写动态代理类的逻辑：
```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

public class InterceptorJdkProxy implements InvocationHandler {

    private Object target; //真实对象
    private String interceptorClass = null;//拦截器全限定名
    
    public InterceptorJdkProxy(Object target, String interceptorClass) {
        this.target = target;
        this.interceptorClass = interceptorClass;
    }

    /**
     * 绑定委托对象并返回一个【代理占位】
     *
     * @param target 真实对象
     * @return 代理对象【占位】
     */
    public static Object bind(Object target, String interceptorClass) {
        //取得代理对象    
        return Proxy.newProxyInstance(target.getClass().getClassLoader(),
                target.getClass().getInterfaces(), 
                new InterceptorJdkProxy(target, interceptorClass));
    }

    @Override
    /**
     * 通过代理对象调用方法，首先进入这个方法.
     *
     * @param proxy --代理对象
     * @param method --方法，被调用方法
     * @param args -- 方法的参数
     */
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        if (interceptorClass == null) {
            //没有设置拦截器则直接反射原有方法
            return method.invoke(target, args);
        }
        Object result = null;
        //通过反射生成拦截器
        Interceptor interceptor = 
            (Interceptor) Class.forName(interceptorClass).newInstance();
        //调用前置方法
        if (interceptor.before(proxy, target, method, args)) {
            //反射原有对象方法
            result = method.invoke(target, args);
        } else {//返回false执行around方法
            interceptor.around(proxy, target, method, args);
        }
        //调用后置方法
        interceptor.after(proxy, target, method, args);
        return result;
    }
}
```
这时开发者就可以根据拦截器接口编写before() around() after()方法来处理代理前后的逻辑了，创建代理对象时传入真实对象和拦截器的实例即可。
```java
public static void testInterceptor() {
    HelloWorld proxy = (HelloWorld) InterceptorJdkProxy.bind(new HelloWorldImpl(), "com.learn.ssm.MyInterceptor");
    proxy.sayHelloWorld();
}
```

### 责任链模式
在我们之前学习的责任链模式中，所有级别的处理者都实现了同一个接口，并具有handleRequest()，setNextHandler()等方法。当有一个请求要处理时如果当前处理者处理完毕或不能处理，则调用下一级的处理者的handleRequest()方法处理该请求。Servlet间传递Request就是一种责任链模式。

责任链模式可以结合拦截器与动态代理模式来使用，创建多个拦截器的实现类并在嵌套创建处理者的动态代理对象时传入：
```java
	public static void testChain() {
		HelloWorld proxy1 = (HelloWorld) InterceptorJdkProxy.bind(
                new HelloWorldImpl(), "com.learn.ssm.Interceptor1");
        HelloWorld proxy2 = (HelloWorld) InterceptorJdkProxy.bind(
                proxy1, "com.learn.ssm.Interceptor2");
        HelloWorld proxy3 = (HelloWorld) InterceptorJdkProxy.bind(
                proxy2, "com.learn.ssm.Interceptor3");
        proxy3.sayHelloWorld();
	}
```
这样就像穿衣服一样由内向外为真实对象的方法添加了拦截器。

### 观察者模式
该模式又称发布订阅模式，通过继承java.util.Observable类和java.util.Observer接口可以方便地创建被观察者和观察者。

这是一种一对多的模式，被观察者只能有一个实例，可以通过单例模式来创建。被观察者可以通过`this.addObserver(observer);`来注册观察者，`this.deleteObserver(observer);`来取消注册观察者。在被观察者改变时通过`this.setChanged();`和`this.notifyObservers(newProduct);`来通知观察者并传递新产品。

观察者在被通知后（update方法被调用）就会执行相应的动作：
```java
public class TaoBaoObserver implements Observer {

    @Override
    public void update(Observable o, Object product) {
        String newProduct = (String) product;
        System.err.println("发送新产品【"+newProduct+"】同步到淘宝商城");
    }    
}
```

### 工厂模式和建造者模式
Spring在创建Bean的时候大量用到了工厂模式和建造者模式，前者对调用者屏蔽了对象的创建过程，后者适合在创建比较复杂的对象时使用。

## 认识MyBatis核心组件
MyBatis封装了JDBC的操作，使得开发者能够能便捷高效地访问数据库，其主要地成功点在于：
1. 不屏蔽SQL，使得开发者能更精确地优化查询。
2. 提供了强大灵活地ORM映射机制，提供了动态SQL地功能，允许开发者根据不同条件组装SQL。
3. 提供了接口代理地功能，只需要接口和XML就能创建映射器，使开发者聚焦于业务逻辑。

MyBatis地核心组件一共有四个：SqlSessionFactoryBuilder（构造器）、SqlSessionFactory（工厂接口）、SqlSession（会话）、SQL Mapper（映射器）。一般情况下我们通过SqlSessionFactoryBuilder读取xml配置文件（也可以使用代码创建，不推荐）来创建SqlSessionFactory，SqlSessionFactory接口有两个实现类：DefaultSqlSessionFactory和SqlSessionManager，后者适用于多线程环境。进一步我们可以通过SqlSession.openSession()来获得SqlSession，使用SqlSession我们可以控制SQL语句的发送、事务的提交回滚等等。

为了能够在SqlSession中发送SQL语句，我们需要实现配置好mapper。可以使用xml创建，也可以直接在接口的方法上注解。前者我们已经比较熟悉了，给出一个后者的简单例子：
```java
public interface UserMapper{
    @Select("select id, name, age from user where id=#{id}")
    public User selectOneUser(int id);
}
```
如果同时使用XML和注解，那么XML方式将覆盖掉注解方式，由于现实场景中会遇到更为复杂的SQL，在注解中不利于维护和修改，加上XML可以相互引入，所以官方更推荐使用XML方式。

我们如果使用SqlSession直接发送SQL，需要通过全限定名+id来定位mapper，而我们还可以通过sqlSession.getMapper(UserMapper.class)来得到Mapper。使用Mapper来发送SQL可以消除SqlSession带来的功能性代码，并且更能体现面向对象的逻辑。

### 核心组件的生命周期
生命周期就是一个对象应该存活的时间，使用完毕后应由JVM销毁以避免继续占用资源。

SqlSessionFactoryBuilder：该对象应该只存在于创建SqlSessionFactory的方法中。

SqlSessionFactory：可以被理解为一个数据库连接池，所以其生命周期存在于整个MyBatis应用之中。另外，我们希望其作为一个单例，在应用中被共享以避免在一个应用中出现多个数据库连接池。

SqlSession：相当于一个数据库连接对象，它应当存活在一个业务请求当中，处理完请求后应该关闭这条连接，让它归还给SqlSessionFactory。

Mapper：代表的是一个请求中的业务处理步骤，所以其生命周期应该小于SqlSession的生命周期。

## MyBatis配置
MyBatis的配置主要包括：
```xml
<configuration><!-- 配置 -->
    <properties/><!-- 属性 -->
    <settings/><!-- 设置 -->
    <typeAliases/><!-- 类型别名 -->
    <typeHandlers/><!-- 类型处理器 -->
    <objectFactory/><!-- 对象工厂，不常用 -->
    <plugins/><!-- 插件 -->
    <environments><!-- 所有环境 -->
        <environment><!-- 某一环境变量 -->
            <transactionManager/><!-- 事务管理器 -->
            <dataSource/><!-- 数据源 -->
        </environment>
    </environments>
    <databaseIdProvider/><!-- 数据库厂商标识 -->
    <mappers/><!-- 映射器 -->
</configuration>
```
这些配置项的顺序不能颠倒，否则MyBatis启动阶段可能发生异常。

***
**未完待续**