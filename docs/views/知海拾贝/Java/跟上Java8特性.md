---
title: Java8的λ表达式与stream API
date: 2020-06-24
tags:
 - Java
categories:
 - 知海拾贝
---
:::tip
JDK1.8新增的λ表达式与stream API是颗很甜的语法糖，能够让某些场景下的代码变得更简洁。结合函数式编程、行为参数化的思想与模板方法模式来学习能有更深的理解。
:::
<!-- more -->


## JDK1.5~1.8发展简要回顾
### JDK5
JDK 5中主要新增了自动装箱与拆箱、枚举、静态导入、变长参数、泛型、JUC并发包和增强for（for-each循环）等特性。

静态导入：
```java
import static java.lang.System.out;

public class StaticImport {
    public static void main(String[] args) {
        out.println("Hi let's learn java 8.");
    }
}
```

变长参数：
```java
public void execute(Vehicle ... cars){
    for(Vehicle v:cars){
        v.run();
    }
}
```

### JDK6
JDK6并没有增加太多常用的特性，主要包含CompilerAPI、Console、DesktopTray、HttpServerAPI、ScriptEngine。

### JDK7
JDK7新增了多异常捕获、数字下划线支持、支持对String和枚举使用switch、tryWithResource、编译器类型推断。

多异常捕获：
```java
public static void main(String[] args) {
    try {
        BufferedReader reader = new BufferedReader(new FileReader(""));
        Connection     con    = null;
        Statement      stmt   = con.createStatement();
    } catch (IOException | SQLException e) {
        //捕获多个异常，e就是final类型的
        e.printStackTrace();
    }
}
```

数字下划线支持（看起来更清晰）:
```java
public static void main(String[] args) {
    int   num         = 1234_5678_9;
    float num2        = 222_33F;
    long  num3        = 123_000_111L;
    long  tenSenconds = 10_000L;
}
```

TryWithResource（自动关闭资源）：
```java
public static void main(String[] args) {
    String path = ScriptEngineDemo.class.getResource("/test.js").getPath();

    try (BufferedReader br = new BufferedReader(new FileReader(path))) {
        String str = br.readLine();
        while (null != str) {
            System.out.println(str);
            str = br.readLine();
        }
    } catch (IOException e) {
        e.printStackTrace();
    }
}
```

### JDK8
JDK8中，新增了内置Base64字符编码、更为精准的日期时间API(java.time.*)、接口中允许有静态方法的实现、nashorn脚本引擎、函数式接口+lambda表达式、stream流和Arrays工具中并行处理等特性。

Base64编码：
```java
public static void main(String[] args) {
    final String text = "Lets Learn Java 8!";

    final String encoded = Base64
            .getEncoder()
            .encodeToString(text.getBytes(StandardCharsets.UTF_8));
    System.out.println(encoded);

    final String decoded = new String(
            Base64.getDecoder().decode(encoded),
            StandardCharsets.UTF_8);
    System.out.println(decoded);
}
```
nashorn脚本引擎:
```java
public static void main(String[] args) throws ScriptException {
    ScriptEngineManager manager = new ScriptEngineManager();
    ScriptEngine        engine  = manager.getEngineByName("JavaScript");

    System.out.println(engine.getClass().getName());
    System.out.println("Result:" + engine.eval("function f() { return 1; }; f() + 1;"));
}
```

函数式接口：
```java
@FunctionalInterface
public interface Functional {
    void method();
    //optional
    default void defaultMethod() {
    }
}
```

## 初识lambda
lambda表达式由`参数`+`->`+`body`组成，鼓励开发者使用行为参数化的风格（方法回调，策略模式），让代码变得更加清晰和灵活，具有以下特性：

* 匿名：它不像普通的方法那样有一个明确的名称：写得少而想得多！
* 函数：lambda函数不像方法那样属于某个特定的类。但和方法一样，有参数列表、函数主体、返回类型，述可能有可以抛出的异常列表。
* 传递：lambda表达式可以作为参数传递给方法或存储在变量中。
* 简洁：无需像匿名类那样写很多模板代码。

lambda表达式基本语法：
```
（parameters）-> expression
或
（parameters）-> {statements；}
```
例子：
```
（1）（）->{}                           //有效，参数和返回值都为空
（2）（）->"Raoul"                      //有效，参数为空返回一个String
（3）（）->{return "Mario"；}           //有效，同上
（4）（Integeri）->return"跟上Java8"+i；//无效，是一个statement，要用{}括起来
（5）（String s）->{"跟上Java8"；}      //无效，不是一个有效的statement
```

### 在哪里以及如何使用lambda
可以针对函数式接口（只有一个抽象方法的接口，空接口或者继承的接口不是函数式接口）使用lambda：
```java
Runnable r1 = () -> System.out.println("Hello world");
Runnabel r2 = new Runnable{
    public void run(){
        System.out.println("Hello world");
    }
};

public static void process(Runnable r){
    r.run();
}

public static void main(String[] args){
    process(() -> System.out.println("Hello world"));
}
```
函数描述符/lambda表达式的签名：
(User, String) -> int

java.util.function中定义了许多函数式接口，例如`Predicate<T>`、`Consumer<T>`、Function`<T,R>`:
```java
Predicate<String> nonEmptyStringPredicate = (String s) -> !s.empty();
List<String> nonEmpty = filter(listOFStrings, nonEmptyStringPredicate);
```
### Java 8中的常用函数式接口

| 函数式接口 | 函数描述符 | 原始类型特化 |
|:-----:|:--------:|:-------|
| `Predicate<T>` | `T -> boolean` | `IntPredicate,LongPredicate, DoublePredicate` |
| `Consumer<T>` | `T -> void` | `IntConsumer,LongConsumer, DoubleConsumer` |
| `Function<T,R>` | `T -> R` | `IntFunction<R>, IntToDoubleFunction,`  `IntToLongFunction, LongFunction<R>,`  `LongToDoubleFunction, LongToIntFunction, `  `DoubleFunction<R>, ToIntFunction<T>, `  `ToDoubleFunction<T>, ToLongFunction<T>` |
| `Supplier<T>` | `() -> T` | `BooleanSupplier,IntSupplier, LongSupplier, DoubleSupplier` |
| `UnaryOperator<T>` | `T -> T` | `IntUnaryOperator, LongUnaryOperator, DoubleUnaryOperator` |
| `BinaryOperator<T>` | `(T,T) -> T` | `IntBinaryOperator, LongBinaryOperator, DoubleBinaryOperator` |
| `BiPredicate<L,R>` | `(L,R) -> boolean` |  |
| `BiConsumer<T,U>` | `(T,U) -> void` | `ObjIntConsumer<T>, ObjLongConsumer<T>, ObjDoubleConsumer<T>` |
| `BiFunction<T,U,R>` | `(T,U) -> R` | `ToIntBiFunction<T,U>, ToLongBiFunction<T,U>, ToDoubleBiFunction<T,U>` |

### Lambdas及函数式接口的例子

| 使用案例 | Lambda 的例子 | 对应的函数式接口 |
|:-----:|:--------|:-------|
| 布尔表达式 | `(List<String> list) -> list.isEmpty()` | `Predicate<List<String>>` |
| 创建对象 | `() -> new Project()` | `Supplier<Project>` |
| 消费一个对象 | `(Project p) -> System.out.println(p.getStars())` | `Consumer<Project>` |
| 从一个对象中选择/提取 | `(int a, int b) -> a * b` | `IntBinaryOperator` |
| 比较两个对象 | `(Project p1, Project p2) -> p1.getStars().compareTo(p2.getStars())` | `Comparator<Project> 或 BiFunction<Project, `  `Project, Integer> 或 ToIntBiFunction<Project, Project>` |

## lambda进阶


***
**未完待续**