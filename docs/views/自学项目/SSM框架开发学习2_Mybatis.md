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

接下来就可以在该UserMapper.xml中写SQL了（而不用在Java源文件中写SQL），其中理论上namespace可以写成任意不重复的名称，但后面整合时通常写为POJO的包名+类名。
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
    public void test1() {
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