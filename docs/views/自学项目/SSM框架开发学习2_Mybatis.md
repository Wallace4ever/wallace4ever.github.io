---
title: SSM框架开发学习笔记-Mybatis部分
date: 2020-07-01
tags:
 - SSM
categories:
 - 自学项目
---
:::tip
在前面入门了Spring MVC的基础上，进一步学习Mybatis。
:::
<!-- more -->

## 初识Mybatis
### 配置项目
首先我们创建一个基于Maven的只使Mybatis的非web项目来认识Mybatis。
1. 在pom.xml中导入mybatis、log4j、junit、mysql驱动等依赖并添加项目对应目录到资源文件的扫描目录。
:::details
```xml
    <dependencies>
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>javax.servlet-api</artifactId>
            <version>4.0.1</version>
            <scope>provided</scope>
        </dependency>

        <!-- https://mvnrepository.com/artifact/org.mybatis/mybatis -->
        <dependency>
            <groupId>org.mybatis</groupId>
            <artifactId>mybatis</artifactId>
            <version>3.5.5</version>
        </dependency>

        <!-- 数据库驱动 -->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>8.0.20</version>
        </dependency>
        
        <!-- log4J打印日志 -->
        <dependency>
            <groupId>log4j</groupId>
            <artifactId>log4j</artifactId>
            <version>1.2.17</version>
        </dependency>
        
        <!-- JUNIT -->
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.12</version>
        </dependency>
    </dependencies>

    <build>
        <finalName>LearnMyBatis</finalName>
        <resources>
            <resource>
                <!-- 由于想将Mapper.xml文件和Mapper接口放在一起，
                                            故将src/main/java添加到资源搜索目录  -->
                <directory>src/main/java</directory>
                <includes>
                    <include>**/*.properties</include>
                    <include>**/*.xml</include>
                </includes>
                <filtering>false</filtering>
            </resource>

            <!-- 原有的src/main/resources也要添加到资源搜索目录 -->
            <resource>
                <directory>src/main/resources</directory>
                <includes>
                    <include>**/*.properties</include>
                    <include>**/*.xml</include>
                </includes>
                <filtering>false</filtering>
            </resource>
        </resources>
    </build>
```
:::
2. 接下来配置db.properties和log4j.properties。
3. 最后创建MyBatisConfig.xml并配置properties resource和environment。
:::details
```xml
<!-- 引入数据源配置文件  -->
<properties resource="db.properties" />

<!-- 定义数据库环境，且默认使用development环境 -->
<environments default="development">
    <!-- 定义id为development的数据库环境 -->
    <environment id="development">
        <!-- 采用jdbc事务管理 -->
        <transactionManager type="JDBC"/>
        <!-- 配置数据库连接信息 -->
        <dataSource type="POOLED">
            <property name="driver" value="${jdbc.driver}"/>
            <property name="url" value="${jdbc.url}"/>
            <property name="username" value="${jdbc.username}"/>
            <property name="password" value="${jdbc.password}"/>
        </dataSource>
    </environment>
</environments>
```
:::

### 使用MyBatis
这样基础环境就配置完毕了，假设要使用Mybatis操作数据库ssm中的User表：
1. 创建表
2. 创建POJO
3. 在项目资源文件夹下创建对应的映射文件：UserMapper.xml（用于映射User类和user表）
4. 在MyBatisConfig.xml中注册该mapper。
```xml
<mappers>
    <mapper resource="mapper\UserMapper.xml"/>
</mappers>
```

接下来就可以在该UserMapper.xml中写SQL了（而不用在Java源文件中写SQL），其中理论上namespace可以写成任意不重复的名称，但后面整合时通常写为POJO的全限定名。
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="user">
    <!--一个namespace下有一组相关SQL语句 -->
    <select id="getUser" resultType="pojo.User">
        select * from user;
    </select>
</mapper>
```
使用Junit对User类进行单元测试：
```java
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;

public class UserTest {
    @Test
    public void testSelect() {
        //查询user表的所有内容
        try {
            //1.连接数据库
            //读取mybatis核心配置文件
            InputStream inputStream= Resources.getResourceAsStream("MyBatisConfig.xml");
            //等价于InputStream inputStream=Thread.currentThread().getContextClassLoader().getResourceAsStream("MyBatisConfig.xml");
            //根据该配置创建SqlSessionFactory
            SqlSessionFactory ssf=new SqlSessionFactoryBuilder().build(inputStream);
            //使用SqlSessionFactory获得session，相当于JDBC的Connection
            SqlSession sqlSession=ssf.openSession();
            //2.执行sql--在UserMapper.xml中根据对应的namespace和id
            List<User> list=sqlSession.selectList("user.getUser");
            for (User user : list) {
                System.out.println(user);
            }
        } catch (Exception exception) {
            exception.printStackTrace();
        }
    }
}
```

## 用MyBatis进行简单查询
一般在一个Mapper.xml中的同一个`<mapper>`下可以针对某一pojo编写其CRUD语句。

### CREATE/INSERT 增
在mapper标签下定义如下：
```xml
<mapper namespace="user">
    <!-- parameterType为输入对象类型，在DML语句中用#{}来取出对象的值 -->
    <insert id="insertUser" parameterType="pojo.User">
        insert into user(name, pwd) VALUES (#{name},#{pwd})
    </insert>
</mapper>
```
接下来可以用session.insert("namespace.id",User)来插入对象，一次事物内可以有多条插入语句，记得commit。
```java
@Test
public void testInsert() {
    try {
        InputStream inputStream=Resources.getResourceAsStream("MyBatisConfig.xml");
        SqlSessionFactory ssf=new SqlSessionFactoryBuilder().build(inputStream);
        SqlSession session=ssf.openSession();

        int count=0;
        for (int i = 0; i < 10; i++) {
            User user=new User("user_"+i,"123");
            count+=session.insert("user.insertUser",user);
        }

        //只要不是DQL语句，执行完都要commit
        session.commit();
        session.close();
        System.out.println("成功插入"+count+"条记录");
    } catch (IOException e) {
        e.printStackTrace();
    }
}
```

### DELETE 删
在mapper中配置：
```xml
    <!-- 删除 如果有where子句则需要配置parameterType-->
    <delete id="deleteUserById" parameterType="int">
        delete from user where id=#{id}
    </delete>
```
我们发现在单元测试中不论是增删改查都需要先创建SqlSessionFactory和Session，执行完SQL语句后要关闭Session，所以封装这些操作并使用注解@Before 和 @After来减少代码冗余。
```java
    SqlSessionFactory ssf;
    SqlSession session;

    @Before
    public void init() {
        //连接数据库--加载mybatis核心配置文件并获得session
        try {
            InputStream inputStream=Resources.getResourceAsStream("MyBatisConfig.xml");
            ssf=new SqlSessionFactoryBuilder().build(inputStream);
            session=ssf.openSession();
        } catch (Exception exception) {
            exception.printStackTrace();
        }
    }

    @After
    public void close() {
        //关闭连接
        session.close();
        session=null;
    }
```
现在编写删除的测试：
```java
    @Test
    public void deleteUser() {
        int n=session.delete("user.deleteUserById",10);
        session.commit();
        System.out.println("删除了"+n+"条记录");
    }
```

### UPDATE 改
mapper，目前暂时只使用parameterType传入1个参数，不考虑多参数的。
```xml
    <update id="updateUser" parameterType="String">
        update user set pwd=#{pwd}
    </update>
```
测试：
```java
    @Test
    public void update() {
        int n=session.update("user.updateUser","88888");
        session.commit();
        System.out.println("更新了"+n+"条记录");
    }
```

### RETRIEVE/SELECT 查
mapper:
```xml
    <select id="getUserById" parameterType="int" resultType="pojo.User">
        select * from user where id=#{id}
    </select>
```
测试：
```java
    @Test
    public void selectOneTest() {
        User user=session.selectOne("user.getUserById",2);
        System.out.println(user);
    }
```
## MyBatis查询条件的传入
### 使用String传入单个查询条件
```xml
    <select id="getUserLikeName1" parameterType="String" resultType="pojo.User">
        select * from user where name like #{s}
    </select>
```
```java
    @Test
    public void vagueSelect() {
        List<User> users=session.selectList("user.getUserLikeName1","user%");
        for (User user : users) {
            System.out.println(user);
        }
    }
```
前面的传值都是使用`#{}`来传值，它是占位符赋值，如果是字符串类型会自动加上`''`（准确来说是`?`会进行预编译），还可以使用`${}`来取值，不过就不会预编译、自动加上单引号，并且`${}`中的属性名要与参数类中的属性名一致。

我们能用`#{}`就不用`${}`。除了动态SQL语句中如果是要取表名则必须用`${}`。

此外在mapper中还可以使用concat
```xml
    <select id="getUserLikeName1" parameterType="String" resultType="pojo.User">
        select * from user where name like concat(#{s},'%')
    </select>
```

### 使用POJO封装多查询条件
当需要传入多个查询条件时，由于parameterType只能传入1个参数，所以可以把条件封装到一个类中。
:::warning
注意，在xml内写sql语句不能直接使用`<`和`>`，因为会被解析为标签。语句中涉及该问题时要使用转义字符。
|原符号|转义字符|
|--|--|
|<|`&lt;`|
|<=|`&lt;=`|
|>|`&gt;`|
|>=|`&gt;=`|
|&|`&amp;`|
|'|`&apos;`|
|"|`&quot;`|
:::
```xml
    <select id="getUserByNameId" parameterType="pojo.User" resultType="pojo.User">
        select * from user where name like concat(#{name},'%') and id&lt;#{id}
    </select>
```
测试：
```java
    @Test
    public void test6() {
        User user=new User(10,"user",null);
        List<User> users=session.selectList("user.getUserByNameId",user);
        for (User u : users) {
            System.out.println(u);
        }
    }
```

### 使用Map封装多查询条件
很多情况下多个查询条件不能封装到一个pojo中，例如要执行多表查询。为此，可使用map查询。将查询的条件放到map中，在SQL语句中就可以使用key来获得值。
```xml
    <select id="getUserByMap" parameterType="java.util.Map" resultType="pojo.User">
        select * from user where id&lt;=#{id} and name like #{name}
    </select>
```
测试：
```java
    @Test
    public void test9() {
        Map<String,Object> map =new HashMap<String,Object>();
        map.put("name","user%");
        map.put("id",10);
        List<User> users=session.selectList("user.getUserByMap",map);
        for (User u : users) {
            System.out.println(u);
        }
    }
```

## Mybatis查询到POJO的关联映射
关联关系是面向对象分析、面向对象设计最终的思想，MyBatis的关联映射可以大大简化持久层的数据访问。关联关系大致可分为：
1. 一对一：例如居民与身份证，任意一方持有对方的id
2. 一对多：例如班级与学生，多的一方持有另一方的id
3. 多对多：例如商品与订单，使用中间表/关系表持有双方的id


### 数据准备

现在我们需要登记住户在疫情期间的入住和流动信息。那么设计ER图时有两个实体：住户和小区，同时这两个实体间存在两种关系：住户住在某一小区（多对一）和住户在多个小区间流动（多对多）。这样就存在两张实体表和一张关系表。

实体表：社区
```sql
create table community(
    c_id int primary key auto_increment,
    c_name varchar(50) not null,
    c_province varchar(20),
    c_city varchar(20),
    c_street varchar(20),
    c_tel varchar(30)
);
```
实体表：住户
```sql
create table resident(
    r_id int primary key auto_increment,
    r_name varchar(30) not null,
    r_tel varchar(40) not null,
    r_sex varchar(10),
    r_age int,
    r_house_number varchar(50),
    r_work_unit varchar(50),
    r_car_num varchar(20),
    r_household bool default true,
    r_c_id int
);
```
关系表：通行记录
```sql
create table record(
    rec_id int primary key auto_increment,
    rec_r_id int,
    rec_c_id int,
    rec_out_city bool default false,
    rec_from_hb bool default false,
    rec_household bool default true,
    rec_now_time datetime
);
```
构造10个社区对象与50个住户对象并插入表中，后面测试插入时如果需要重置自增的id可以：
```sql
ALTER TABLE table DROP id;
ALTER TABLE table ADD id INT NOT NULL PRIMARY KEY AUTO_INCREMENT FIRST
```

### 多对一关系
在数据库中一对多和多对一体现形式是一样的（主键与外键），只是我们在POJO中的体现有所不同。

如果要执行如下所示的多表查询：
```xml
<select id="getAllResident2" resultType="pojo.Resident">
    select r.r_id,r.r_name,c.c_name,c.c_id
    from resident r,community c
    where r.r_c_id=c.c_id
</select>
```
那么就需要改动返回类型Resident类为其增加c_name属性，这显然是和面向对象原则冲突。正确的方法应该是在Resident类中添加一个对Community对象的引用，并在mapper中先自定义返回的结果集resultMap。
```xml
<!--
(I)resultMap的属性:id是唯-标识, type是关联的pojo类
(2)子标签<id>,column=关联表的主键名, property=pojo的对应属性
(3)子标签<result> ,对表的字段和pojo的属性进行匹配。column=关联表的字段名 , property=pojo的对应属性
(4)于标签<association >,配置关联POJO对象, property=对象名 javaType=关联pojo的类型
只读取配置了的字段,没有配置的字段不会去读取
-->

<resultMap id="residentInfo" type="pojo.Resident">
    <id column="r_id" property="r_id"/>
    <result column="r_name" property="r_name"/>
    <association property="community" javaType="pojo.Community">
        <id column="c_id" property="c_id"/>
        <result column="c_name" property="c_name"/>
    </association>
</resultMap>
```
接下来编写的select标签就不使用resultType而是resultMap了：
```xml
<select id="getAllResident2" resultMap="residentInfo">
    select r.r_id,r.r_name,c.c_name,c.c_id
    from resident r,community c
    where r.r_c_id=c.c_id
</select>
```
总结：多对一关系在数据库、POJO、MyBatis中的体现
1. 数据库：n一方的外键对应1那一方的主键
2. POJO：n一方包含一个1那一方的属性
3. MyBatis：自定义resultMap返回n一方并通过association关联1那一方。

### 一对多关系
在pojo的`1`类中添加`n`类的容器比如Community类中增加属性`List<Resident>`。对于容器我们需要在resultMap中添加`<collection>`标签
```xml
<resultMap id="commInfo" type="pojo.Community">
    <id column="c_id" property="c_id"/>
    <result column="c_name" property="c_name"/>
    <result column="c_province" property="c_province"/>
    <result column="c_city" property="c_city"/>
    <result column="c_street" property="c_street"/>
    <result column="c_tel" property="c_tel"/>
    <collection property="residentList" ofType="pojo.Resident">
        <id column="r_id" property="r_id"/>
        <result column="r_name" property="r_name"/>
        <result column="r_house_number" property="r_house_number"/>
    </collection>
</resultMap>
```

### 多对多关系
考虑人员在小区间的流动通行需要登记，那么这就是一个多对多的关系。

**例子：查询某个通行者一共到过哪几个社区**，那么对应的Mapper为
```xml
<select id="whereYouGo"  parameterType="int" resultMap="map1">
    select r.r_name,c.c_name,rec.rec_now_time
    from resident r,community c,record rec
    where r.r_id=#{param} and r.r_id=rec.rec_r_id and c.c_id=rec.rec_c_id
    order by c.c_name
</select>
```
老师是在通行者pojo中添加`List<Record>`再为Record pojo添加Community属性，我觉得这样没什么问题，但是查询的通行记录应该封装在Record中，所以应该是在Record pojo中添加Resident和Community两个属性，一条Record就记录了是谁在何时通过哪个小区。这时自定义resultMap为：
```xml
<resultMap id="map1" type="pojo.Record">
    <!-- 很奇怪明明上面没有select rec_id 但是这里不写的话结果集会丢失大部分结果 -->
    <id column="rec_id" property="rec_id"/>
    <result column="rec_now_time" property="rec_now_time"/>
    <association property="community" javaType="pojo.Community">
        <id column="c_id" property="c_id"/>
        <result column="c_name" property="c_name"/>
    </association>
    <association property="resident" javaType="pojo.Resident">
        <id column="r_id" property="r_id"/>
        <result column="r_name" property="r_name"/>
    </association>
</resultMap>
```
测试：
```java
@Test
public void selectTest() {
    List<Record>list=session.selectList("record.whereYouGo",40);
    list.forEach(System.out::println);
}
```

## MyBatis接口代理（整合Spring MVC小试牛刀）
我们希望**每个实体都有对应的DAO接口**，并且能够直接使用DAO接口提供的方法。
![CMkle.png](https://wx2.sbimg.cn/2020/07/06/CMkle.png)
MyBatis为我们提供了解决方案：接口代理。开发者只编写实体对应的mapper接口（对应以前JSP+Servlet+Javabean开发中的Dao接口）即可，不必编写具体的Dao实现类。要想使用接口代理,必须要满足的规范约定。

首先仍然是要创建好项目：
* 于Maven创建webapp项目，并在pom.xml中导入mybatis、mysql、log4j、junit、servlet、jstl、spring相关的依赖以及添加资源搜索目录。
* 在资源目录下添加 db.properties、log4j.properties、MyBatisConfig.xml、spring-servlet.xml，在MyBatisConfig.xml中引入db.properties作为数据源配置，在web.xml中注册DispatcherServlet并使用spring-servlet.xml作为配置文件，spring-servlet.xml中依然是配置扫描包、注解与视图解析器。
* 与以前的开发有所不同，这次在java源文件目录下我们除了创建controller、pojo、util三个包外，还创建mapper包（和DAO对应）。mapper包中存放的就是我们定义的Mapper接口。

### 模型层使用MyBatis接口代理🚩
#### MyBatis接口代理配置步骤
0. 定义数据库
1. 定义pojo
2. 定义Mapper接口
    * Mapper接口方法名和PojoMapper.xml中定义的每个sql的id同名。
    * Mapper接口方法的输入参数类型和PojoMapper.xml中定义的sql的parameterType类型相同。
    * Mapper接口的返回类型和PojoMapper.xml中定义的sgl的resultType类型相同
3. 定义映射文件
    * 在mapper.xml中namespace的值等于Mapper接口的全限定名
    * Mapper接口中的方法名和mapper.xmI中statement的id必须一致
    * Mapper接口中的方法输入参数类型和mapper.xmI中statement的parameterType指定的类型一致
    * Mapper接口中的方法返回值类型和mapper.xml中statement的resultType指定的类型一 致
4. 注册mapper到MyBatis核心配置文件中
    * 可使用单个注册或包注册

那么MyBatis接口代理的“代理”体现在哪里呢？

一般对于每一张表会有一个pojo，以前我们会为每个pojo写一个POJODAO的实现类，现在则只需要给出对应的POJO Mapper接口。例如针对Record类创建RecordMapper接口，并在接口中声明`public int insertOneRecord(Record r);`、`public int deleteOneRecord(Record r);`、`public List<Record> getAllRecords(String param1, int param2,...);`等方法。以往我们需要自己提供DAO接口的实现类，完成下面的操作：
1. 建立连接
2. 得到Statement对象
3. **给出sq|语句**
4. 执行sq|语句并处理结果(基本类型、引用类型、结果集)
5. 断开连接

而现在我们在声明Mapper接口后，只需要对应其中每一个方法给出sql语句即可（当然Mapper接口和mapper映射文件的定义必须严格遵守上面的要求），其余的步骤都由MyBatis替我们完成。这其实就吻合了`代理模式`这一设计模式。

之前我们在MyBatisConfig.xml中使用的是单个mapper的方式来注册，现在把PojoMapper接口和PojoMapper.xml放在mapper包下就可以使用包注册：
```xml
<mappers>
    <package name="edu.seu.mapper"/>
</mappers>
```
#### 调用方法
下面就可以做测试，使用session.getMapper来自动创建接口的实例：
```java
@Test
public void execute() {
    CommunityMapper mapper=session.getMapper(CommunityMapper.class);
    List<Community> list=mapper.getAllCommunity();
    list.forEach(System.out::println);
}
```

### 视图层与控制层使用Spring MVC
以录入新的社区信息为例，在community_add.jsp中编写表单填入社区信息并将action指向我们的Controller/Method：
```java
@Controller
@RequestMapping("/com")
public class CommunityController extends AbstractSessionGetter{

    @RequestMapping("/add")
    public ModelAndView add(Community community) {
        ModelAndView mv = new ModelAndView();
        this.get();
        CommunityMapper mapper=session.getMapper(CommunityMapper.class);
        int n=mapper.insertCommunity(community);
        session.commit();
        if (n > 0) {
            mv.addObject("com", community);
            mv.setViewName("community_show");
        } else {
            mv.addObject("num",n);
            mv.setViewName("message");
        }
        this.close();
        return mv;
    }
}
```
我们将SqlSessionFactory和SqlSession以及获得、关闭session的方法放在AbstractSessionGetter中以便于多个PojoController重用。每次在相应Method中使用MyBatis接口代理获得PojoMapper，进一步使用该mapper执行数据库操作。执行之后根据结果响应对应的视图。

Spring MVC的Controller是默认采用了单例模式，在首次被请求时创建并可以被多个请求共用。如果要使用多例模式，可以对该Controller使用`@Scope`注解。
***
**未完待续**