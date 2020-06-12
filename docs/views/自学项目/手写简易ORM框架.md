---
title: 手写简易ORM框架
date: 2020-06-01
tags:
 - ORM
categories:
 - 自学项目
---

:::tip
我们希望设计一个可以实现简单对象和SQL自动映射的框架，但是整体用法和设计比Hibernate、Mybatis简单，只保留基础的功能。本项目参考了高淇老师的Java300集课程，目的在于加深对ORM框架的理解，同时也增加对设计模式的理解。本文篇幅较长建议根据二级标题查询温故，项目源代码见[Github仓库](https://github.com/Wallace4ever/MYORM)。
:::
<!-- more -->

# 功能设计

## 框架主要功能
* 增：将对象生成相应的SQL语句，执行，插入数据库中
* 删：根据对象主键的值，生成SQL，执行，从数据库中删除
* 改：根据对象需要修改的属性的值，生成SQL，执行修改。
* 查：执行查询并按结果分类。
    * 多行多列：`List<Javabean>`
    * 一行多列：`Javabean`
    * 一行一列：
        * 普通对象：`Javabean`
        * 数字：`Number`

## 核心架构设计
* 核心类
    * Query接口：负责查询（对外提供服务的核心类），可以有针对MySQL、Oracle等不同数据库的实现，使用接口屏蔽具体数据库的差异
    * QueryFactory类：负责根据配置信息创建Query对象
    * TypeConvertor接口：负责类型转换
    * TableContext类：负责获取管理数据库所有表结构和类结构的关系，并可以根据表结构生成类结构
    * DBManager类：根据配置信息，维持连接对象的管理（增加连接池功能）
* 工具类
    * JDBCUtils：封装常用JDBC操作
    * StringUtils：封装常用字符串操作
    * JavaFileUtils：封装Java文件操作
    * ReflectUtils：封装常用反射操作
* 核心Javabean，封装相关数据：
    * ColumnInfo 封装表中一个字段的信息
    * TableInfo 封装一张表的信息
    * Configuration 封装配置文件信息（目前使用资源文件，后期可以增加XML文件配置和注解）

# 动手实现

## 初步建立源文件架构
首先对应上面的设计，在项目下新建`core`、`bean`、`utils`三个包，用于存放下面的类与接口。在接口中添加增删改查相关的方法。
```
src
├── po//后面根据数据库表信息自动生成的JavaBean源文件所在的包
└── sorm
    ├── bean
    │   ├── ColumnInfo.java
    │   ├── Configuration.java
    │   ├── JavaFieldGetSet.java
    │   └── TableInfo.java
    ├── core
    │   ├── DBManager.java
    │   ├── MySqlTypeConverter.java
    │   ├── QueryFactory.java
    │   ├── Query.java
    │   ├── TableContext.java
    │   └── TypeConverter.java
    ├── db.properties
    ├── Main.java//用于定位db.properties，用线程来定位的方法目前有些问题
    └── utils
        ├── JavaFileUtils.java
        ├── JDBCUtils.java
        ├── ReflectUtils.java
        └── StringUtil.java
```

其中，Query接口定义相关的增删改查方法
```java
public interface Query {
    //直接执行一个DML语句
    public int executeDML(String sql, Object[] params);

    //将一个对象存储到数据库中
    public void insert(Object object);

    //删除cla表示类对应的表中指定id的记录
    public int delete(Class cla, int id);//delete from user where id =2;

    //删除对象在数据库中对应的记录（对象所属的类对应到表，对象主键的值对应到记录）
    public void delete(Object object);

    //更新对象对应的记录，并且只更新指定的字段的值
    public int update(Object object, String[] filedNames);//update user set uname=?,pwd=? where id=?;

    //查询返回多行记录，并将每行记录封装到cla指定类的对象中
    public List queryRows(String sql, Class cla, Object[] params);

    //查询返回一行记录，并将每行记录封装到cla指定类的对象中
    public Object queryUniqueRow(String sql,Class cla, Object[] params);

    //查询单个值，这时就不用封装到Javabean对象中了
    public Object queryValue(String sql, Object[] params);

    //查询单个数字，可以是Integer/Double/Long等等
    public Number queryNumber(String sql, Object[] params);
}
```

创建以下Javabean，提供构造方法与get/set方法。

* TableInfo类的属性有：表名（`String t_name`）、所有字段的信息（`Map<String,ColumnInfo> columns`）、主键（`ColumnInfo primaryKey`）、联合主键（`List<ColumnInfo> primaryKeys`）。
* ColumnInfo类的属性有：字段名称（`String name`）、字段的数据类型（`String dataType`）、字段的键类型（`int keyType` [0：普通键；1：主键；2：外键]）。
* Configuration类的属性有：数据库驱动类、url、用户名、密码、数据库类型、项目源码路径等。

## 获取表结构：Configuration、DBManager与TableContext
DBManager类维护一个Configuration对象，从资源文件中读取配置信息到该对象中。
```java
private static Configuration conf=null;
static {//静态代码块，只需要加载一次配置资源文件
    Properties properties=new Properties();
    try {
        properties.load(Main.class.getResourceAsStream("db.properties"));
    } catch (IOException e) {
        e.printStackTrace();
    }
    conf=new Configuration();
    conf.setDriver(properties.getProperty("driver"));
    conf.setPoPackage(properties.getProperty("poPackage"));
    conf.setPwd(properties.getProperty("pwd"));
    conf.setSrcPath(properties.getProperty("srcPath"));
    conf.setUrl(properties.getProperty("url"));
    conf.setUser(properties.getProperty("user"));
    conf.setCurrentDB(properties.getProperty("currentDB"));
}
```
返回连接，维持连接对象的管理（后面增加连接池的功能）：
```java
public static Connection getConn() {
    try {
        Class.forName(conf.getDriver());
        //直接建立连接，后面增加连接池处理
        return DriverManager.getConnection(conf.getUrl(),conf.getUser(),conf.getPwd());
    } catch (ClassNotFoundException | SQLException e) {
        e.printStackTrace();
        return null;
    }
}
```
TableContext类使用DBManager获得数据库连接，并维护两个Map `Map<String, TableInfo> tables`和`Map<Class, TableInfo> poClassTableMap`，用于管理表结构与类结构的关系。使用`java.sql.DatabaseMetaData`来获得数据库表结构，并加载入Map中。

## MySQL数据类型转换器：MySqlTypeConverter
设计一个MySqlTypeConverter类实现TypeConverter接口，转换MySQL中的数据类型名为Java中的数据类型名，便于生成Java类源代码。
```java
public String db2JavaType(String columnType) {
    if ("varchar".equalsIgnoreCase(columnType)||"char".equalsIgnoreCase(columnType)) {
        return "String";
    }else if ("int".equalsIgnoreCase(columnType)
            ||"tinyint".equalsIgnoreCase(columnType)
            ||"smallint".equalsIgnoreCase(columnType)
            ||"integer".equalsIgnoreCase(columnType)
            ){
        return "Integer";
    }else if ("bigint".equalsIgnoreCase(columnType)){
        return "Long";
    }else if ("double".equalsIgnoreCase(columnType)){
        return "Double";
    }else if ("float".equalsIgnoreCase(columnType)){
        return "Float";
    }
    /*更多类型...*/
    return null;
}
```

## 根据表信息生成Java类源代码：JavaFileUtils
在JavaFileUtils中，我们需要设计静态方法以根据传入的TableInfo、ColumnInfo、TypeConverter来生成数据库中表对应的类的源代码。
### 生成单个类属性及Get/Set方法的源码
首先针对单个数据库字段->Java类属性。需要封装什么样的数据，就创建什么样的Javabean。因此，再创建一个这样的一个Javabean：JavaFieldGetSet.java，通过`private String fieldInfo,getInfo,setInfo;`来封装单个属性的属性声明、get方法、set方法的源码。

接下来在JavaFileUtils中增加对应的静态方法来返回封装好的JavaFieldGetSet对象。
```java
/**
    * 根据字段生成Java属性信息以及相应的get/set源码。如varchar username-> private String username;
    * @param column 字段信息
    * @param converter 类型转化器
    * @return Java属性以及相应的get/set源码
    */
public static JavaFieldGetSet createFieldGetSetSRC(ColumnInfo column, TypeConverter converter) {
    JavaFieldGetSet jfgs=new JavaFieldGetSet();
    
    //生成属性声明的源码
    String javaFieldType = converter.db2JavaType(column.getDataType());
    jfgs.setFieldInfo("\tprivate "+ javaFieldType+" "+column.getName()+";\n");

    //要生成get方法源码：类似于public String getUsername(){return username;}这样的代码
    StringBuilder getSrc=new StringBuilder();
    getSrc.append("\tpublic "+javaFieldType+" get"+StringUtil.firstChar2UpperCase(column.getName())+"(){\n");
    getSrc.append("\t\treturn "+column.getName()+";\n");
    getSrc.append("\t}\n");
    jfgs.setGetInfo(getSrc.toString());

    //要生成set方法源码：类似于public void setUsername(String username){this.username=username;}这样的代码
    StringBuilder setSrc=new StringBuilder();
    setSrc.append("\tpublic void"+" set"+StringUtil.firstChar2UpperCase(column.getName())+"(");
    setSrc.append(javaFieldType+" "+column.getName()+"){\n");
    setSrc.append("\t\tthis."+column.getName()+"="+column.getName()+";\n");
    setSrc.append("\t}\n");
    jfgs.setSetInfo(setSrc.toString());

    return jfgs;
}
```
### 生成整个Java类的源代码
在上一步中，已经完成JavaFieldGetSet类设计，并可以通过createFieldGetSetSRC方法来封装单个属性的定义、get方法以及set方法的源代码。接下来即可编写方法，根据传入的TableInfo和converter，为表中的每一个字段创建JavaFieldGetSet对象并维护在List容器中。之后便可批量添加每个属性的定义、get方法、set方法到最终的源代码中。
```java
/**
    * 根据表信息生成java类的源代码
    * @param tableInfo 表信息
    * @param converter 数据类型转换器
    * @return java类的源码
    */
public static String createJavaSrc(TableInfo tableInfo,TypeConverter converter) {
    Map<String,ColumnInfo> columns=tableInfo.getColumns();
    List<JavaFieldGetSet> javaFields=new ArrayList<>();
    for (ColumnInfo c : columns.values()) {
        javaFields.add(createFieldGetSetSRC(c,converter));
    }

    StringBuilder src=new StringBuilder();
    //生成package语句
    src.append("package "+ DBManager.getConf().getPoPackage()+";\n\n");
    //生成import语句
    src.append("import java.sql.*;\n");
    src.append("import java.util.*;\n\n");
    //生成类声明语句
    src.append("public class "+StringUtil.firstChar2UpperCase(tableInfo.getT_name())+" {\n\n");
    //生成属性列表
    for (JavaFieldGetSet f : javaFields) {
        src.append(f.getFieldInfo());
    }
    src.append("\n\n");
    //生成get方法列表
    for (JavaFieldGetSet f : javaFields) {
        src.append(f.getGetInfo());
    }
    //生成set方法列表
    for (JavaFieldGetSet f : javaFields) {
        src.append(f.getSetInfo());
    }
    //生成类结束符
    src.append("}\n");
    System.out.println(src);
    return src.toString();
}
```

### 将源代码写入到指定包中的.java文件
在前面得到一张表对应的java类源代码的基础上，将源代码写入指定包下的.java源文件中
```java
public static void createJavaPOFile(TableInfo tableInfo, TypeConverter converter) {
    //得到源代码
    String src=createJavaSrc(tableInfo,converter);
    String srcPath=DBManager.getConf().getSrcPath()+"/";
    String packagePath=DBManager.getConf().getPoPackage().replaceAll("\\.","/");

    File file=new File(srcPath+packagePath);
    if (!file.exists()) {//指定目录不存在则帮助用户建立
        file.mkdirs();
    }

    BufferedWriter bw=null;
    try {
        bw=new BufferedWriter(new FileWriter(file.getAbsolutePath()+"/"+StringUtil.firstChar2UpperCase(tableInfo.getT_name())+".java"));
        bw.write(src);
        bw.flush();
        bw.close();
    } catch (IOException e) {
        e.printStackTrace();
    }
}
```
那么就可以在TableContext类中创建静态方法updateJavaPOFile()并在其自身的静态代码块中调用，实现了每次加载本框架时就更新一次数据库中的表到对应的类源文件。
```java
public static void updateJavaPOFile() {
    Map<String,TableInfo> map=TableContext.tables;
    for (TableInfo ti : map.values()) {
        JavaFileUtils.createJavaPOFile(ti,new MySqlTypeConverter());
    }
}
```
:::warning
这边遇到了一个坑，之前根据老师教的内容在TableContext类中使用DatabaseMetaData获取数据库中表信息时使用的是：
```java
ResultSet tableSet=metaData.getTables(null,"orm","%",new String[]{"TABLE"});
```
我在网上查的一些早期的资料称MySQL不支持第一个参数catalog，置空即可，直接使用第二个参数schemaPattern来把范围缩小到目标数据库。然而这里却将整个MySQL中所有的schema中的table都获取了过来，将catalog调整为"orm"就解决了该问题，可能是MySQL从某个版本开始支持使用catalog了？
:::

## 编写Query的实现类MySqlQuery：DML语句
前面已经完成了第一大步：由表的信息生成对应的java类。接下来就需要编写Query的实现类，ORM是对象关系映射，增删改是从对象到数据库，查询是从数据库到对象。

### 生成并执行delete语句
首先要实现根据类和主键删除对应的记录，主键通常是int id，但有时也可能是其他类型故改为Object。为了通过po类得到对应的表信息TableInfo中的主键值，需要使用TableContext类中维护的`Map<Class, TableInfo> poClassTableMap`。
```java
@Override
public int delete(Class cla, Object id) {
    //类结构与表结构的映射Emp.class,2-> delete from emp where id=2
    //通过Class对象找TableInfo，进一步得到表名与主键名
    TableInfo tableInfo=TableContext.poClassTableMap.get(cla);
    ColumnInfo onlyPriKey=tableInfo.getPrimaryKey();
    String sql="delete from "+tableInfo.getT_name()+" where "+onlyPriKey.getName()+"=?";
    return  executeDML(sql,new Object[]{id});
}
```
此外还可能需要根据某一具体的对象删除其在表中对应的记录，这时可以根据该对象对应的po类进一步得到其在在Map中对应的TableInfo表结构对象,从而得到该表的主键名。得到主键名后使用反射调用该对象对应的"get主键()"方法得到该对象的主键值。此时就可以调用`delete(Class cla, Object id)`实现构造与删除。
```java
@Override
public void delete(Object object) {
    Class c=object.getClass();
    TableInfo tableInfo=TableContext.poClassTableMap.get(c);
    ColumnInfo primaryKey=tableInfo.getPrimaryKey();
    //通过反射机制调用属性对应的get/set方法
    Object value=ReflectUtils.invokeGet(primaryKey.getName(),object);
    delete(c,value);
}

public static Object invokeGet(String fieldName, Object object) {
    //通过反射机制调用该对象该属性对应的get方法
    Object obj=null;
    try {
        Class cla=object.getClass();
        Method method=cla.getMethod("get"+ StringUtil.firstChar2UpperCase(fieldName),null);
        obj=method.invoke(object,null);
    } catch (NoSuchMethodException | IllegalAccessException | InvocationTargetException e) {
        e.printStackTrace();
    }
    return obj;
}
```
### 真正执行DML语句
无论是增删改最终都需要调用executeDML()方法，其中包括获取数据库连接、预编译SQL语句、设置SQL参数、返回执行结果。
```java
public int executeDML(String sql, Object[] params) {
    Connection conn=DBManager.getConn();
    int count =0;
    PreparedStatement ps=null;
    try {
        ps=conn.prepareStatement(sql);
        JDBCUtils.handleParams(ps,params);
        count=ps.executeUpdate();
    } catch (SQLException throwables) {
        throwables.printStackTrace();
    }
    return 0;
}
```
其中将为SQL设置参数的功能封装到JDBCUtils.handleParams(ps,params)方法中。
```java
public static void handleParams(PreparedStatement ps, Object[] params) {
    if (params != null) {
        for (int i = 0; i < params.length; i++) {
            try {
                ps.setObject(1+i,params[i]);
            } catch (SQLException throwables) {
                throwables.printStackTrace();
            }
        }
    }
}
```

### 生成并执行insert语句
生成insert语句的过程是由po对象obj得到`insert into 表名 (字段名,字段名，……) values (参数,?,...)`的过程。
```java
@Override
public void insert(Object object) {
    Class cla=object.getClass();
    TableInfo tableInfo=TableContext.poClassTableMap.get(cla);
    List<Object> list=new ArrayList<>();//存储sql参数对象
    StringBuilder sql=new StringBuilder("insert into "+tableInfo.getT_name()+" (");

    //获得类所有的属性，以及将参数对象插入list中
    Field[] fs=cla.getDeclaredFields();
    int countNotNullField=0;
    for (Field f : fs) {
        String fieldName=f.getName();
        Object fieldValue=ReflectUtils.invokeGet(fieldName,object);
        if (object != null) {
            sql.append(fieldName+",");
            countNotNullField++;
            list.add(fieldValue);
        }
    }
    sql.setCharAt(sql.length()-1,')');
    sql.append(" values (");
    for (int i = 0; i < countNotNullField; i++) {
        sql.append("?,");
    }
    sql.setCharAt(sql.length()-1,')');
    executeDML(sql.toString(),list.toArray());
}
```

### 生成并执行update语句
类似地，由传入的obj和要修改的属性名数组{"uname","pwd"}生成 `update 表名 set uname=?,pwd=? where id=?`。
```java
public int update(Object object, String[] filedNames) {
    Class cla=object.getClass();
    TableInfo tableInfo=TableContext.poClassTableMap.get(cla);
    ColumnInfo primaryKey=tableInfo.getPrimaryKey();
    List<Object> list=new ArrayList<>();
    StringBuilder sql =new StringBuilder("update "+tableInfo.getT_name()+" set ");

    for (String fname : filedNames) {
        Object fvalue=ReflectUtils.invokeGet(fname,object);
        list.add(fvalue);
        sql.append(fname+"=?,");
    }
    list.add(ReflectUtils.invokeGet(primaryKey.getName(),object));
    sql.setCharAt(sql.length()-1,' ');
    sql.append("where ");
    sql.append(primaryKey.getName()+"=? ");
    return executeDML(sql.toString(),list.toArray());
}
```

## 编写Query的实现类MySqlQuery：DQL语句
根据DQL语句的不同，查询的结果可分为多行多列（`List<Javabean>`）、一行多列（`单个Javabean对象`）和一行一列（`单个对象的一个属性Object`）。

:::warning
当然，这些查询是针对一张表的，而如果需要进行复杂的连表查询，这时TableContext又不能自动生成对应的复合Javabean，则目前可以新建一个vo包，在该包下手动建立一个SpecialVO类封装要查询的所有属性，再调用queryRows方法。
:::

### 多行多列
分别使用ResultSet.getMetaDada().getColumnLabel(i)和ResultSet.getObject(i)获取属性名和属性值，根据cla创建该类的实例，并调用该实例的set方法设置对应的属性值，将所有实例存入List当中并返回。多行多列是最核心的，在其基础上剩余的几项都较为容易。

```java
public List queryRows(String sql, Class cla, Object[] params) {
    Connection conn=DBManager.getConn();
    List list=null;
    ResultSet rs=null;
    PreparedStatement ps=null;
    try {
        ps=conn.prepareStatement(sql);
        JDBCUtils.handleParams(ps,params);
        System.out.println(ps);
        rs=ps.executeQuery();

        ResultSetMetaData metaData=rs.getMetaData();
        //查询的结果集为多行
        while (rs.next()) {
            if (list == null) {
                list=new ArrayList();
            }
            //调用Javabean的无参构造器
            Object rowObj=cla.newInstance();
            //多列query如 select username,pwd,age from user where id>? and age >18
            for (int i = 0; i<metaData.getColumnCount();i++) {
                String columnName=metaData.getColumnLabel(i+1);
                Object columnValue=rs.getObject(i+1);

                //调用rowObject的setUsername方法，将columnValue放进去
                ReflectUtils.invokeSet(rowObj,columnName,columnValue);
            }
            list.add(rowObj);
        }
    } catch (Exception e) {
        e.printStackTrace();
    }
    return list;
}
```
### 一行多列、一行一列
只需调用多行多列方法并检验得到的List不为空元素数量大于0时，返回第一个Javabean即可。一行一列和多行多列相比，不用要返回List或者Javabean，只需要返回resultSet.getObject(1)即可。

:::tip
至此，一个具有简易功能的ORM框架大体上已经写成。下面就要进一步对其进行设计优化、增加数据库连接池、编写文档以及打包发布等操作。
:::

## Query类设计模式优化：模版方法模式/回调❤
审视目前的MySqlQuery，我们可以发现其中很多具体的过程可能也能用于OracleQuery等实现类，所以把这些可以共用的部分挪动到Query中，这时需要将Query改为抽象类。

接下来观察QueryRows(QueryUniqueRow)和QueryValue(QueryNumber)，发现两者中有很多冗余的代码，而在执行DQL语句的过程中流程都是一样的：`获得连接->预编译SQL语句->设置参数->执行并得到结果集->处理结果集并返回特定对象`。其中只有最后一步是需要根据查询的行列数来具体处理的。这时就可以用到**模版方法**模式，将流程骨架放到`executeQueryTemplate(String sql,Object[] params,Class cla,Callback callback)`这一模版方法中，封装好对数据库的访问，而对结果的处理则延迟到具体方法再做。

通常情况下使用模版方法模式是在父类中定义好处理的流程和步骤（即包含了一些具体方法和抽象方法），特定步骤（抽象方法）的具体实现延迟到子类中定义。而在本项目中`executeQueryTemplate`是Query类下的一个方法，方法本身不存在继承的说法，想要抽象出其中的特定步骤延迟到使用时（QueryRows、QueryNumber）再定义，则可以结合回调机制。

首先定义接口或抽象类Callback，其中声明根据查询的行列数来具体处理结果集的方法`public Object doExecute(Connection conn, PreparedStatement ps, ResultSet rs);`（该方法主要对rs进行处理），这时在模版方法中就可以直接调用该接口的doEcecute()方法。接下来就可以在具体方法调用此模版时再给出Callback的实现类（往往是匿名内部类），并返回对rs的处理结果。

```java
public Object executeQueryTemplate(String sql,Object[] params,Class cla,Callback callback) {
    Connection conn=DBManager.getConn();
    ResultSet rs=null;
    PreparedStatement ps=null;
    try {
        ps=conn.prepareStatement(sql);
        JDBCUtils.handleParams(ps,params);
        rs=ps.executeQuery();
        //以上都是固定的流程

        //具体方法调用此模版时再给出Callback的实现类，并返回对rs的处理结果
        //doExecute()称为钩子方法或回调，由模版方法控制整个过程
        Object result=callback.doExecute(conn,ps,rs);

        //固定流程
        rs.close();
        ps.close();
        conn.close();
        return result;
    } catch (Exception e) {
        e.printStackTrace();
        return null;
    }
}
```
具体方法中使用模版（以QueryValue为例）：
```java
public Object queryValue(String sql, Object[] params) {
    return executeQueryTemplate(sql, params, null, new Callback() {
        @Override
        public Object doExecute(Connection conn, PreparedStatement ps, ResultSet rs) {
            Object value=null;
            try {
                while (rs.next()) {
                    value = rs.getObject(1);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return value;
        }
    });
}
```
:::warning
老师说这里的钩子方法又称为回调，但我查了更多关于回调的知识，感觉这里仅仅是模版方法中对具体实现类的一次普通调用。更多关于Java回调的知识可移步至[Java回调机制](../知海拾贝/Java回调机制.md)。
:::

## Query类设计模式优化：工厂模式/单例模式/克隆模式
到目前为止，我们都是自己在Query中建立main方法并手动new一个Query的实现类来进行测试，然而真正在使用时应向用户隐藏实现类的创建逻辑。用户只需要知道Query接口和并配置要使用的数据库类型，就可以从QueryFactory那里得到一个实例。

为此，在db.properties中新增一条queryClass，记录要使用的类。QueryFactory使用单例模式，可以使用反射创建该类的实例：
```java
public class QueryFactory {
    private static QueryFactory factory=new QueryFactory();
    //私有构造方法，饿汉式单例模式
    private QueryFactory() {}
    Class c;
    static {
        try {
            //加载指定的Query类
            Class c= Class.forName(DBManager.getConf().getQueryClass());
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
    public Query createQuery(){
        try {
            return (Query)c.newInstance();
        } catch (InstantiationException | IllegalAccessException e) {
            e.printStackTrace();
            return null;
        }
    }
    public static QueryFactory getFactory(){
        return factory;
    }
}
```
不过每次使用反射创建实例效率可能较低，可使用克隆（原型）模式创建实例。为此需要将Query标记为`implements Cloneable`，在加载工厂类时创建实例，每次调用createQuery时返回实例的一个克隆。
```java
public class QueryFactory {
    private static Query prototypeObj;//原型对象
    //私有构造方法，单例模式
    private QueryFactory() {}

    static {
        try {
            //加载指定的Query类
            Class c= Class.forName(DBManager.getConf().getQueryClass());
            prototypeObj=(Query) c.newInstance();
        } catch (ClassNotFoundException | InstantiationException | IllegalAccessException e) {
            e.printStackTrace();
        }
    }

    public static Query createQuery(){
        try {
            return (Query) prototypeObj.clone();
        } catch (CloneNotSupportedException e) {
            e.printStackTrace();
            return null;
        }
    }
}
```

## 增加数据库连接池
JDBC建立Connection对象是一个很耗时的操作，因为底层需要创建一个Socket通信。如果用户取数据时每次都创建一个连接，用完后又关闭连接，则效率大大降低。为此，创建连接池，维护一定数量的Connection对象。每次有用户要获得连接时，从池中取出一个Connection对象，使用完后用户并不真正地关闭该对象，而是放回池中供下一个用户使用，这样能够大大提升效率。市面上目前有DBCP、c3p0、proxool等成熟的连接池产品。
```
连接池（Connection Pool）
    ·就是将Connection对象放入List中，反复重用！
-连接池的初始化：
    ·事先放入多个连接对象。-从连接池中取连接对象
    ·如果池中有可用连接，则将池中最后一个返回。同时，将该连接从池中remove，表示正在使用。
    ·如果池中无可用连接，则创建一个新的。
-关闭连接
    ·不是真正关闭连接，而是将用完的连接放入池中。
```
将原来DBManager中的getConn()方法中使用JDBC获得新连接的方法重命名为createConn()以供DBConnPool使用，同时将getConn作为从连接池中取连接的方法。

```java
/**
 * 初始化连接池，使连接数量达到最小值
 */
public void initPool() {
    if (pool == null) {
        pool=new ArrayList<>();
    }
    while (pool.size() < DBConnPool.POOL_MIN_SIZE) {
        pool.add(DBManager.createConn());
        System.out.println("初始化池，连接数为："+pool.size());
    }
}

/**
 * 从连接池中取出一个连接
 * @return 取出的连接
 */
public synchronized Connection getConnection() {
    int lastIndex=pool.size()-1;
    Connection conn=pool.get(lastIndex);
    pool.remove(lastIndex);
    return conn;
}

/**
 * 并不是真正关闭，将连接放回池中
 * @param conn 要放回的连接
 */
public synchronized void close(Connection conn) {
    if (pool.size() >= POOL_MAX_SIZE) {
        try {
            if (conn != null) {
                conn.close();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    } else {
        pool.add(conn);
    }
}
```
经测试，查询1000次，不加连接池耗时11419ms，增加连接池后耗时2370ms。查询次数增加时差异更加明显。

未完待续