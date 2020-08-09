---
title: Redis学习
date: 2020-08-04
tags: 
 - Redis
categories: 
 - 自学项目
---
## Redis简介
NoSQL 

* 可扩容，可伸缩
* 大数据量下高性能
* 灵活的数据模型
* 高可用

常见的NoSQL数据库：Redis memcache HBase MongoDB

概念: Redis (REmote DIctionary Server)是用C语言开发的一一个开源的高性能键值对(key-value) 数据库。

特征:
1. 数据间没有必然的关联关系
2. 内部采用单线程机制进行工作
3. 高性能。 官方提供测试数据，50个并发执行100000个请求,读的速度是110000次/s,写的速度是81000次/s。
4. 多数据类型支持
●字符串类型string
●列表类型list
●散列类型hash
●集合类型set
●有序集合类型sorted set
5. 持久化支持。可以进行数据灾难恢复

Redis的应用场景
* 为热点数据加速查询(主要场景) ,如热点商品、热点新闻、热点资讯、推广类等高访问量信息等
* 任务队列,如秒杀、抢购、购票排队等
* 即时信息查询，如各位排行榜、各类网站访问统计、公交到站信息、在线人数信息(聊天室、网站)、设备信号等
* 时效性信息控制，如验证码控制、投票控制等
* 分布式数据共享,如分布式集群架构中的session分离
* 消息队列
* 分布式锁

## Redis数据存储类型
Redis自身是一个Map，其中所有的数据都是采用key:value的形式存储，key永远都是字符串，我们讨论的数据存储类型是value部分的类型。

### string类型
单个数据，最简单也是最常用的数据存储类型，一个存储空间保存了一个数据，如果字符串以整数的形式展示则可以作为数字操作使用。

String类型的基本操作：
```
添加/修改数据
set key value
获取数据
get key
删除数据
del key（成功返回1失败返回0）
添加修改多个数据
mset key1 value1 key2 value2 ...
获取多个数据
mget key1 key2 ...
获取value字符串长度
strlen key
追加信息到原始信息后，不存在则新建
append key value
```

单数据操作set和多数据操作mset该如何选择：
数据操作经历了三个过程：客户端发送指令->服务器执行指令->服务器返回结果。这三个步骤都是需要时间的，没有明确规则说明什么时候要用mset，但如果使用多指令的时候要考虑如果一次发送执行并返回的时间消耗非常大的话对于单线程的Redis是不太适用的，所以要找到最佳的分割点。

String类型的扩展操作：

**场景：** 大型企业级应用中分库分表是基本操作，使用多张表存储同类型数据，但主键id必须保证统一性，不能重复。使用Redis能控制id，为数据库表主键提供生成策略，保障主键的唯一性。String在Redis内部存储默认是字符串，遇到增减操作时转换为数值型进行计算。如果不能转换或超过了Long.MAX_VALUE将报错。
```
# 设置数值数据增加指定范围的值
incr key //key+1
incrby key increment //值增加指定的increment
incrbyfloat key increment //增加小数

# 设置数值数据减少指定范围的值
decr key
decr key increment
```

**场景：** 投票规定每天只能投一票、热门商品在榜首不超过3小时，验证码五分钟内有效。redis控制数据的生命周期，通过数据是否失效控制业务行为，适用于所有具有时效性限定控制的操作。
```
setex key seconds value
psetex key milliseconds value
```

String类数据未获取到返回(nil)，数据最大存储量为512MB，一般不会也没有必要用到这么大的热点数据。

**场景：** 应用于限时按次结算的服务控制
一分钟内允许最多调用10次，超过10次则拒绝服务，每隔1分钟重置调用计数。
```
setex uid:0001 60 0 //设置该用户1min内已经调用次数为0
get uid:0001 //用户发起调用时先检查次数，达到10则拒绝服务，如果为nil则再执行上一条语句
incr uid:0001 //成功调用服务后计数+1
```

**场景：** Redis应用于各种结构型和非结构型高热度数据访问加速，例如为大V用户设定粉丝数、推文数等信息，这时可以这样存储并设定定时刷新策略：
```
//以数据库中用户的主键和属性值作为key
set user:id:123:fans 12345646
set user:id:123:blogs 789

//以json格式存储用户的整个热点信息
set user:id:123 {fans:12345646, blogs:789}
```
热点数据key的命名惯例一般为：`表名:主键名:主键值:字段名`，前者增减更方便，后者需要读取后更改部分再重新写入。

### hash类型
在上一个场景中，如果使用json同时又有频繁的更新操作会显得笨重，分成多个key-value的话key中有很多重复的部分，并且从逻辑上这些都是同一个用户的信息。我们现在可以这样划分：
```
                    fans    12345646
user:id:123
                    blogs   789
```
将`user:id:123`作为key，右侧的value作为一个完整的存储空间，那么右侧又是一个key-value结构，这就是Redis的hash类型，不过hash里的key我们称作field。

hash可以对一系列存储的数据进行编组（例如存储对象的各属性），方便管理。其底层如果field数量较少会优化为类数组结构，如果角度使用HashMap结构。

hash类型的基本操作：
```
# 添加或修改数据
hset key field value
# 如果不存在数据才添加否则什么都不做
hsetnx key field value
# 获取数据
hget key field
hgetall key
# 删除数据
hdel key field1 field2 ...

# 添加或修改多个数据
hmset key field1 value1 field2 value2 ...
# 获取多个数据
hmget key field1 field2 ...
# 获取哈希表中字段数量
hlen key
# 获取哈希表中是否存在指定字段
hexists key field
```
hash类型的扩展操作：
```
# 获取哈希表中所有的字段名
hkeys key
#获取哈希表中所有的字段值
hvals key

# 设定指定字段的数值数据增加指定范围的值
hincrby key field increment //hincrbyfloat增加小数 
```
hash的value只能存储字符串，不存在嵌套现象，每个hash可以存储最多2^32-1个键值对。hash类型很接近对象的数据存储形式并可以灵活添加和删除对象属性，但其初衷不是为了存储大量对象而设计的不可以滥用。hgetall操作如果内部field过多速度就会降低，可能成为数据访问的瓶颈。

### list类型
list存储多个数据，并对数据进入存储空间的顺序进行区分，底层使用双向链表实现。由于是双向链表所以从两边都可以插入数据，可以模拟栈和队列的操作。

list类型数据的基本操作：
```
# 添加或修改数据
lpush key value1 value2 ...
rpush key value1 value2 ...

# 获取数据
lrange key start stop //从左边数第start位置到第stop位置的所有数据 例如0 2查看前三个数据 0 -1第0个到倒数第一个
lindex key index //查看第index个元素是
llen key //查看list长度

# 获取并移除数据
lpop key //左侧出1，左进左出等同于栈，右进左出等同于队列
rpop key
```
list数据类型的扩展操作：
```
# 规定时间内从若干个list获取并移除数据，任意一个获取到就返回（阻塞式数据获取）
blpop key1 [key2 ...] timeout
brpop key1 [key2 ...] timeout
```
list可能为空，这时在时间超限之前都会阻塞，一旦有别的客户端向list内插入数据则pop该数据。可以从多个list中等数据，这就对应着任务队列的实现操作。

```
# 移除指定位置的数据
lrem key count value //从左往右删掉count个值为value的数据（list中可能有相同数据）
```
list保存数据是string类型的，单个list最多存2^32-1个元素。list具有索引概念，但一般以栈和队列的形式进行操作。队列模型可以解决多路信息汇总合并的问题，栈模型可以解决最新消息的问题。

### set类型
list底层采用双向链表，查询效率并不高，我们现在需要存储大量数据并在查询方面提供更高的效率。
这时就有了set类型，set类型与hash存储结构完全相同，仅存储键不存储值（nil），并且不允许重复。

set类型数据的基本操作：
```
# 添加数据
sadd key member1 member2 ...
# 获取全部数据
smembers key
#删除数据
srem key member1 member2 ...
# 获取集合数据总量
scard key
# 判断集合中是否包含指定数据
sismember key member
```
set类型的扩展操作（可以用于随机推荐信息）：
```
# 随机获取集合中指定数量的数据
srandmember key [account]
# 随机获得并移除集合中的指定数量的数据
spop key [account]
```
set类型的扩展操作（两个集合的交并差集）：

可用于深度关联搜索，得到共同好友，独立访问量统计，黑白名单等等。
```
# 求两个集合的交、并、差集
sinter keyl [key2] ...
sunion keyl [key2] ...
sdiff keyl [key2] ... //这里是前面集合减去后面的集合
# 求两个集合的交、并、差集并存储到指定集合中
sinterstore destination keyi[key2]
sunionstore destination keyl [key2]
sdiffstore destination keyl [ key2]
# 将指定数据从原始集合中移动到目标集合中
srmove source destination member
```
redis可以提供基础数据（smembers）也可以提供校验结果（sismember），但后者是把校验的业务逻辑放到存储这边来做了，有一定的耦合，不推荐。

### sorted_set（zset）类型
list能保存数据的插入顺序，但不能按照元素的自然顺序进行排序。我们需要保存可排序的数据，sorted_set应运而生。

sorted_set在set存储结构的基础上添加了可排序的字段score，score字段不用来存储数据而仅用来排序。

sorted_set类型数据的基本操作：
```
# 添加数据
zadd key score1 member1 score2 member2 ...
# 获取排序后指定序号范围数据
zrange key start stop [withscores] //查看指定范围的数据（升序），如果加上withscores会连同分数一并显示
zrevrange key start stop [withscores] //查看降序排序的数据
# 删除数据
zrem key member1 member2 ...

# 按照score范围获取数据
zrangebyscore key min max [withscores] [LIMIT offset count] //limit限制返回查询到的结果数量
zrevrangebyscore key max min [withscores] [LIMIT offset count]

# 按排序后的顺序删除数据
zremrangebyrank key start stop
# 按score删除顺序
zremrangebyscore key min max

# 获取集合数据量
zcard key
zcount key min max
# 集合交并操作（合并时默认对相同的元素的score相加，可以用过AGGREGATE来控制使用最大值或最小值）
zinterstore destination numkeys(要合并的集合数量) key1 key2 ...[AGGREGATE SUM|MIN|MAX]
zunionstore destination numkeys key1 key2 ...
```
sorted_set类型数据的扩展操作：
```
# 获取数据对应的索引（排名）
zrank key member //从小到大排第几，得到0表示最小，第1小
zrevrank key member //从大到小排第几，得到0表示最大，第1大

# score值获取与修改
zscore key member
zincrby key increment member
```
score保存的数据存储空间为64位，可以为整数也可以为双精度double值，但double值可能丢失精度导致比较不准确要慎重使用。

## Redis通用指令
### key的操作
key一定是string类型，常用的操作有：
* 对于key自身状态的相关操作，如删除、判定存在、获取对应的数据类型；
* 对key有效性控制相关的操作，如有效期设定、判定是否有效、有效状态的切换等；
* 对于key的快速查询操作，如指定策略查询key。

状态操作：
```
# 删除指定key
del key
# 获取key是否存在
exists key
# 获取key对应的value类型
type key
```
时效性控制：
```
# 为指定key设置有效期
expire key seconds
pexpire key milliseconds
expireat key timestamp
pexpireat key milliseconds-timestamp

# 获取key的有效时间
ttl key //如果key不存在返回-2，如果未设置有效期返回-1，否则返回剩余的有效时长
pttl key

#切换key从时效性转为永久性
persist key
```
扩展操作（查询模式）
```
# 查询符合pattern的key
keys pattern //如keys *表示查询所有的key
//*匹配任意数量的任意符号，？匹配任意单个字符，[]匹配括号内的任一单个字符
```
其他操作：
```
# 为key改名
rename key newkey //如果newkey已经存在则会覆盖
renamenx key newkey //如果newkey不存在才能改名成功

# 为list/set/sorted_set中所有key排序
sort key //返回排序的结果，但不会修改原数据顺序
```

### 数据库的通用指令
key是由开发者定义的，在使用过程中，伴随着操作数据量的增加会出现大量的数据以及对应的key，数据不区分种类混杂在一起，极易出现重复或冲突。Redis为此提供了解决方案，每个服务提供有16个数据库0~15，每个数据库之间相互独立。

```
# 切换数据库
select index //index从0~15

# 其他操作
quit
ping
echo message
```
默认在0号数据库，我们只能获得当前数据库中的key，切换到其他数据库后就不能再获取了。这时可以对数据进行移动。
```
move key db //移动操作必须保证目标数据库没有同名的key，否则移动失败
```
数据清除：
```
# 查看当前数据库key数量
dbsize 
# 清除当前数据库
flushdb
# 清除所有数据库的所有数据
flushall
```

## Jedis
Jedis、SpringData Redis、Lettuce都是Java语言连接操作Redis的工具，使用Jedis的步骤很简单，分为三步：
```java
import org.junit.Test;
import redis.clients.jedis.Jedis;

public class JedisTest {
    @Test
    public void testJedis() {
        //1.连接Redis
        Jedis jedis = new Jedis("127.0.0.1", 6379);
        //2.操作Redis
        jedis.set("name", "Tom");
        System.out.println(jedis.get("name"));
        //3.关闭连接
        jedis.close();
    }
}
```
其中，jedis对象的操作方法与redis提供的指令完全吻合。以list和hash类型为例简单测试一下：
```java
@Test
public void testList() {
    jedis.lpush("list1", "a", "b", "c");
    jedis.rpush("list1", "x");
    List<String> list1 = jedis.lrange("list1", 0, -1);
    for (String str : list1) {
        System.out.println(str);
    }
    System.out.println(jedis.llen("list1"));
}

@Test
public void testHash() {
    jedis.hset("hash1", "f1", "v1");
    jedis.hset("hash1", "f2", "v2");
    jedis.hset("hash1", "f3", "v3");
    Map<String, String> hash1 = jedis.hgetAll("hash1");
    hash1.forEach((k,v)-> System.out.println(k+":"+v));
    System.out.println(jedis.hlen("hash1"));
}
```

### 案例模拟
假设作为服务提供方我们为A、B、C三个用户提供服务，每分钟限制A用户调用10次、B用户调用30次、C用户不作限制。创建一个多线程类，模拟用户调用。
```java
import redis.clients.jedis.Jedis;
import redis.clients.jedis.exceptions.JedisDataException;

public class Service {
    private String id;
    private int maxCall;
    public Service(String id,int maxCall) {
        this.id = id;
        this.maxCall = maxCall;
    }

    //控制单元
    public void service() {
        Jedis jedis = new Jedis("127.0.0.1",6379);
        String value = jedis.get("compid:" + id);
        try {
            //判断该值是否存在
            if (value == null) {
                jedis.setex("compid:" + id, 5, Long.MAX_VALUE - maxCall + "");
            } else {
                Long val = jedis.incr("compid:" + id) - (Long.MAX_VALUE - maxCall);
                doBusiness(val);
            }
        } catch (JedisDataException e) {
            System.out.println("单位时间内使用次数达到上限");
        } finally {
            jedis.close();
        }
    }

    //业务操作
    public void doBusiness(Long val) {
        System.out.println("用户"+id+"执行第"+val+"次业务操作！");
    }
}

class MyThread extends Thread {
    Service service;

    public MyThread(String id,int maxCall) {
        service = new Service(id,maxCall);
    }

    @Override
    public void run() {
        while (true) {
            service.service();
            try {
                Thread.sleep(300L);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}

class Main {
    public static void main(String[] args) {
        MyThread mt1 = new MyThread("A",10);
        mt1.start();
        MyThread mt2 = new MyThread("B",30);
        mt2.start();
    }
}
```
后续还可以对业务控制方案进行改造，例如增加判断用户是否不限次数，是则直接调用业务。另外，调用次数的限制不会写死到程序中，我们可以写入配置文件或者将不同用户的等级信息、限制调用次数存入Redis中。

### Jedis连接池工具类开发
上面我们每次在控制单元中都手动创建管理Jedis对象，利用Jedis提供的JedisPool我们可以方便地创建连接池。
```java
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

import java.util.ResourceBundle;

public class JedisUtils {
    private static JedisPool jp = null;
    static {
        ResourceBundle rb = ResourceBundle.getBundle("redis");
        //Jedis连接池核心配置
        JedisPoolConfig jpc = new JedisPoolConfig();
        //最大连接数
        jpc.setMaxTotal(Integer.parseInt(rb.getString("redis.maxTotal")));
        //活动连接数
        jpc.setMaxIdle(Integer.parseInt(rb.getString("redis.maxIdle")));
        String host = rb.getString("redis.host");
        int port = Integer.parseInt(rb.getString("redis.port"));
        jp = new JedisPool(jpc,host,port);
    }

    public static Jedis getJedis() {
        return jp.getResource();
    }
}
```
这时在业务中调用控制逻辑时就可以用JedisUtils.getJedis()来从连接池中取出连接了。

## Linux下安装配置Redis
以CentOS为例，主要有以下几个步骤：
* 下载安装包： `wget http://download.redis.io/releases/redis-X.X.X.tar.gz`
* 解压缩 `tar -xvf 文件名.tar.gz`
* 编译安装 `make install` 
    * 如果下载的是6.0以上版本的Redis可能需要安装8版本的gcc、gcc-c++、gdb工具链
        ```bash
        yum install centos-release-scl scl-utils-build
        yum install -y devtoolset-8-toolchain
        scl enable devtoolset-8 bash
        gcc --version
        ```
之后我们进入到src目录下就能看到安装好的redis-server和redis-cli等可执行文件了。

如果要启动多个Redis服务，需要在启动时指定端口：`redis-server --port 6380`，
这时客户端连接时也要指明端口：`redis-cli -p 6380`。

### Redis配置
企业开发中不可能每次都指定端口来启动服务，redis根目录下提供了默认配置文件redis.conf，我们可以查看它并过滤掉注释行和空行：
```bash
cat redis.conf  | grep -v "#" | grep -v "^$"
# 将这些内容追加到一个新的配置文件中以便我们进行修改
cat redis.conf  | grep -v "#" | grep -v "^$" > redis-6379.conf
```
配置文件中注释掉我们暂时不用的内容，只保留下面四条：
```
port 6379
daemonize yes # 是否以守护进程的方式启动
logfile "6379.log" # 配置日志文件名
dir /root/redis-6.0.6/data # 生成的日志文件的位置
```
现在在启动服务时可以通过`redis-server redis-6379.conf`来加载配置，由于配置了以守护进程的方式启动，所以来确认一下进程是否在运行：
```bash
[root@centos-vm redis-6.0.6]# ps -ef | grep redis-
root      8979     1  0 14:20 ?        00:00:00 redis-server *:6379
root      8985  7948  0 14:20 pts/0    00:00:00 grep --color=auto redis-
```
能够看到该进程id为8979，并且通过redis-cli连接测试成功。使用`kill -s 9 8979`来杀死该进程。

我们在Redis根目录下创建一个conf目录，将配置了不同端口的配置文件放到该目录下，之后就可以用这些配置文件启动多个redis服务进程了。