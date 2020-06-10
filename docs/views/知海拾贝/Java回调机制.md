---
title: Java中的回调机制
date: 2020-06-10
tags:
 - Java
categories:
 - 知海拾贝
---

:::tip
今天学习手写简易ORM框架的课程中老师讲到了用回调对Query类进行优化，虽然之前学习设计模式的时候对模版方法模式有所了解，但三下五除二又设计了一些方法和类，在理解不透彻的情况下会觉得反而优化地更复杂了，故学习一下回调机制加深理解。
:::
<!-- more -->

## 模块间调用的类型
模块或者方法间的调用类型有：

1. `同步调用`：是最基本并且最简单的一种调用方式，类A的方法a()调用类B的方法b()，一直等待b()方法执行完毕，a()才继续执行。这种调用方式适用于方法b()执行时间不长的情况，否则会造成整个流程的阻塞。
2. `异步调用`：类A的方法方法a()通过新线程调用类B的方法b()，自身代码继续执行。这样无论方法b()执行时间多久，都不会阻塞住方法a()的执行。但这种方式只能在a不需要b的执行结果时才能使用，否则就需要a对b的执行结果进行监听。
3. `回调`：类A的a()方法调用类B的b()方法，类B的b()方法执行完毕主动调用类A的callback()方法。

## 回调的一个简单的例子
首先定义一个回调接口Callback，其中只有一个回调方法callback()：
```java
public interface Callback{
    public void callback(<T> ... params);
}
```
主动调用类A中有自己的业务逻辑，其中的某些方法调用了B类实例（可能是多个）的b方法。同时A类也实现了Callback接口。
```java
class A implements Callback{
    List instancesOfB;
    int result=0;
    //some methods
    public void work(){
        //...
        for(B b:instancesOfB){
            b.executeTask(this);
        }
        //...
    }

    @override
    public void callback(<T>... params){
        int tmp=0;
        for(T param:params){
            tmp+=param.getCount();
        }
        synchronized(A){
            result+=temp;
        }
    }
}
```
B类中被调用的方法executeTask()需要传入一个实现Callback接口的类，B执行完后调用对应的callback方法。
```java
class B{
    //可能还会有其他参数传入供其使用
    public void executeTask(Callback cb){
        //execute logic...
        cb.callback(result);
    }
}
```

如果只是简单返回某个结果，确实没有必要使用回调而可以直接使用同步调用。但是如果有多种数据需要处理且数据有主次之分，或者大量可并行的计算可以分配给被调用者计算，那么使用回调会是一种更加合适的选择，优先处理的数据放在回调方法中先处理掉。