---
title: SSM框架开发学习笔记
date: 2020-06-15
tags:
 - SSM
categories:
 - 自学项目
---
:::tip
前面学习的手写简易ORM框架的课程让我对对象关系映射有了进一步的理解，接下来学习JavaEE开发中非常典型的SSM框架（Spring MVC、Spring、Mybatis），
:::
<!-- more -->

## MVC设计模式简要回顾
本科阶段的JavaEE课程中使用JSP+Servlet+Javabean的开发模式一般为：
```
1.设计数据库的表结构【实体层，不可见】
2.构建POJO：模型Bean【数据访问层DAL】（Model）
3.构建UserDAO：逻辑Bean，处理所有的JDBC操作【数据访问层DAL】（Model）
4.编写Servlet：处理客户端的请求【业务逻辑层BLL+界面层UI】（Controller）
5.编写Jsp：获得用户请求、显示反馈结果【界面层UI】（View）
```