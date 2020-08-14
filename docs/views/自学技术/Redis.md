---
title: Redis学习
date: 2020-08-04
tags: 
 - Redis
categories: 
 - 自学技术
---
# Redis基础
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

# Redis高级

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

## Redis持久化方案
持久化是利用永久性存储介质将数据进行保存，在特定时间将保存的数据进行恢复的工作机制。

持久化过程保存的形式有：
* 数据快照的形式：将当前数据状态进行保存，存储数据结果，存储格式简单，关注点在数据
* 数据操作的过程（日志）：存储操作过程，存储格式复杂，关注点在数据的操作过程。

Redis中这两种形式都存在，快照形式称为RDB，日志形式称为AOF

### RDB
#### 手动命令 立即执行
RDB由Redis操作者手动执行，可以用于随时保存数据。命令为：
```
save
```
在前面配置Redis的启动配置时，我们曾经配置过`dir /root/redis-6.0.6/data`，在Redis中存入一定数据后，我们执行save指令，这时在该目录下就会保存一个名为`dump.rdb`的二进制快照文件，更多save指令相关的配置有：
```
# 设置本地数据库文件名，默认为dump.rdb，通常设置为dump-端口号.rdb
dbfilename dump-6379.rdb

# 设置存储至本地时是否压缩，默认为yes采用LZF压缩，设置为no可以节约CPU时间，但文件会变得非常大
rdbcompression yes

# 设置是否进行rdb文件格式校验，默认为yes，在读写过程中均会进行校验，设置为no能节约10%时间消耗但有一定数据损坏风险
rdbchecksum yes
```
Redis在下次启动时会自动加载dump文件中的数据。

#### 手动命令 后台执行
:::warning
由于redis是单线程执行任务队列中的任务，save指令会阻塞当前redis服务器，直到当前RDB过程完成为止，数据量过大时有可能造成长时间的阻塞，线上环境不建议使用。
:::

针对单线程执行RDB在面对过大数据量时可能造成的效率低的问题，可以使用后台执行的方式。仍由redis操作者发起指令，但redis服务器可能不会立即执行，而是控制在合理的时间执行。后台保存操作的指令为：
```
bgsave
```
bgsave的原理在于，服务器收到该指令后向客户端返回一条“Background saving started”消息，之后会抽空调用Linux的fork函数生成子进程来创建rdb文件，创建结束后向父进程返回消息，能在日志文件中看到该记录。建议所有涉及RDB的操作都采用bgsave的方式，放弃使用save命令。bgsave的一条相关配置为`stop-writes-on-bgsave-error yes`，默认为yes，如果后台存储中出现错误则停止保存操作。

#### 自动执行
人工反复多次执行保存指令是不现实的，Redis服务器可以基于设定的条件自动发起指令。该条件在配置文件中进行配置：
```
# 每隔second秒的时间内如果key的变化量达到changes，则进行持久化
save second changes
```
该配置启动后执行的是bgsave操作，要根据实际业务情况进行设置，频度过高或过低都会出现性能问题，seconds和change通常具有互补对应关系，通常不要设置成包含性关系。并且不进行数据比对，例如设定时间内反复执行set key1 value1这样的操作达到设定次数时也会执行持久化。

#### RDB的特殊启动形式
* 主从复制中的全量复制会启动RDB
* 服务器运行过程中使用`debug reload`指令重启会启动RDB
* 关闭服务器时指定保存数据`shutdown save`会启动RDB

#### RDB优缺点
优点：
* RDB是一个紧凑压缩的二进制文件，存储效率较高
* RDB是某个时间点的数据快照，适合用于数据备份、全量复制、灾难恢复等场景。
* 其数据恢复速度要比AOF快很多

缺点：
* RDB无法做到实时持久化，具有较大可能性丢失部分数据
* bgsave指令每次要执行fork操作创建子进程，要牺牲一些性能
* 不同版本的Redis的RDB文件格式可能出现不兼容的现象。
* 数据量大时IO性能较低，每次读写都是全部数据

### AOF
由于RDB存在以上缺点，这时AOF（append only file）就是一种互补的解决方案。AOF仅记录部分数据，具体来说记录的不是数据而是操作过程，以独立日志的方式对所有写操作进行记录，排除丢失数据额风险，重启时再重新执行AOF文件中的命令达到数据恢复的目的。AOF主要解决的时数据持久化的实时性，已经是Redis持久化的主流方式。

#### AOF写数据的过程
在操作者发送写指令后，Redis服务器接收到这条指令，并没有马上记录，而是放到AOF写命令刷新缓存区中，到了一定阶段后再把这些指令写入到aof文件中。AOF写数据有三种策略（`appendfsync`）：
* always（每次），每次操作均同步到AOF文件中，数据零误差，性能较低
* everysec（每秒），每秒同步到AOF文件，准确性较高、性能较高
* no（系统控制），整体过程不可控

AOF配置：
```
# 是否开启AOF，默认为no
appendonly yes|no
# AOF写数据策略
appendfsync always|everysec|no
# 自定义AOF持久化文件名，默认为appendonly.aof，建议配置为applendonly-端口号.aof
appendfilename filename
# 持久化文件保存路径，和RDB文件保持一致即可
dir path
```

#### AOF重写
随着命令不断写入AOF，文件会越来越大，为此Redis引入了AOF重写机制压缩文件体积。AOF重写是将Redis进程内的数据转化成写命令同步更新到AOF文件的过程，简单来说就是将对同一个数据的若干条命令执行结果转化成最终结果数据对应的指令进行记录。

AOF重写可以降低磁盘占用量，提高持久化写和恢复的效率。重写有如下规则：
* 超时数据不再写入文件
* 忽略无效指令，使用进程内数据直接生成，只保留最终数据的写入命令
* 对同一数据的多条写命令合并为一条命令，为防止数据量过大造成缓冲区溢出，对于list每条指令最多写入64个元素

```
# 手动重写指令
bgrewriteaof
```
手动发送`bgrewriteaof`指令时返回一条`Background append only file rewriting started`消息，类似bgsave会创建一个子进程来重写aof文件，子进程执行完后返回消息给父进程。

```
# 自动重写配置
auto-aof-rewrite-min-size size # 默认值比较大32/64M，如果aof_current_size大于该值则触发重写
auto-aof-rewrite-percentage pecentage # 当aof_current_size减去aof_base_size再除以base size即变化百分比达到阈值时触发重写
```

#### AOF与AOF重写的工作原理
配置开启了AOF后，主进程会fork子进程，如果策略为always则每条指令都写入AOF文件，否则都会先将指令写入AOF缓存区和AOF重写缓存区中，再写入AOF文件。此时如果手动发送`bgrewriteaof`则会fork子进程来把AOF重写缓存区中的数据合并替换原来的AOF文件。

### RDB与AOF比较
|持久化方式|RDB|AOF|
|--|--|--|
|占用空间|小，数据级压缩|大，指令级重写|
|存储速度|慢|快|
|恢复速度|快|慢|
|数据安全性|可能丢失部分数据|依据策略决定|
|资源消耗|高、重量级|低、轻量级|
|启动优先级|低|高|

如何选择？
* 如果数据非常敏感，不能接受数分钟以内的数据丢失，建议使用默认的AOF持久化方案。
* 如果数据呈现阶段有效性，能接受短期内的数据丢失，建议使用RDB持久化方案。
* 灾难恢复选用RDB
* 双保险策略，同时启用，Redis重启后优先使用AOF来恢复数据，减少丢失数据的量。

### 持久化应用场景分析
场景1：redis用于控制数据库表主键id，为数据库表主键提供生成策略，保障数据库表主键的唯一性。不建议进行持久化，而是应该从数据库中读最大的id+1再存入使用。

场景2：redis应用于各种结构型和非结构型热点数据的访问加速。不建议进行持久化。

场景3：redis应用于购物车的设计。不建议进行持久化。

场景4：redis应用于抢购，限购类、限量发放优惠卷、激活码等业务的数据存储设计。由于这些快速改变的数据不一定来得及写入到数据库中，所以建议持久化，并且少量的误差是可以容忍的。

场景5：redis应用于具有操作先后顺序的数据控制，如果数据量不是特别大建议持久化，因为也可能不存入数据库。

场景6：redis应用于最新消息展示，可能选择用专门的消息队列产品了。

场景7：redis应用于同类信息的关联搜索，二度关联搜索，深度关联搜索。不需要持久化，直接读数据库即可。

场景8：redis应用于基于黑名单与白名单设定的服务控制，如果黑名单是短期策略则存建议做持久化，白名单和部分黑名单是长期策略，不做redis持久化。

场景9：redis应用于计数器组合排序功能对应的排名，需要持久化，因为存数据库里可能没意义。

场景10：redis应用于即时任务/消息队列执行管理

场景11：redis应用于单位时间内按次结算的服务控制，一般不持久化，因为往往时效性已过。

## Redis事务
### 事务的定义与使用
Redis的事务和关系型数据库的事务定义类似，但也有一定区别。Redis执行指令的过程中，可能出现多条连续执行的指令被干扰、打断、插队的情况。

Redis事务就是一个命令执行队列，将一系列预定义命令包装成一个整体。当执行时，一次性按顺序执行、中间不会被打断或者干扰。

在关系型数据库中我们分别使用`START TRANSACTION`和`COMMIT`来开启和提交事务，在Redis中，我们使用`multi`和`exec`指令来说明后面多条指令属于一个事务并执行这个事务。加入事务的命令暂时进入到任务队列中并没有立即执行，只有执行exec命令时才开始执行。类似于关系型数据库中的`ROLLBACK`，Redis中也可以使用`discard`来终止当前事务的定义。

Redis服务器在接收到指令后，首先判断本身是否在事务状态：
* 不在事务状态，识别命令，如果是普通指令则执行并返回结果，如果是multi指令则创建队列返回OK
* 在事务状态，识别命令，普通命令则加入命令执行队列，exec指令则执行事务并返回事务中每条指令的执行结果并销毁队列，discard指令则直接销毁队列，exec和discard都会推出事务状态。

注意事项：
* 如果定义事务中包含的命令存在语法错误，则会直接导致该事务被discard。
* 如果定义的指令语法正确但无法正确执行（例如对list进行incr操作），则能够被正确运行的命令会执行并返回结果，但运行错误的命令返回错误信息不会对数据产生影响。正真开发中要测试、避免这种问题。真的出现误操作后的一种下策是记录操作前数据的状态，之后再手动回滚。

### 监视锁
业务场景：多个客户端可能同时操作同一组数据，数据一旦被修改则不应继续操作。这时需要在操作之前锁定要操作的数据，一旦发生变化则终止当前操作。

解决方案：
```
# 对key添加监视锁，在执行exec前如果key发生变化则终止事务执行
watch key1 [key2 ...] 
# 取消对所有key的监视
unwatch
```
监视锁必须在开启事务之前添加，之后在本客户端的首个事务执行前，如果key对应的值发生变化，则该事务执行被终止，返回nil。后面的事务不受影响。

### 分布式锁
场景：有100件商品，如果有更多的人要同时抢购该商品，如何避免不发生超卖？

解决方案：利用setnx命令的返回值特征，有值则返回设置失败，无值则返回设置成功。
```
# 使用setnx设置一个公共锁，操作完毕后使用del释放锁
setnx lock-key value
```
客户端修改数据前现要获得锁，如果setnx失败则要排队等待。当然这种方案是一种设计概念，没有真正对目标数据上锁，依赖约定的规范来保证安全，具有一定风险。

### 死锁解决方案
在上面的方案中，如果一个客户端加锁后出现宕机或忘记释放锁，则其它客户端都不能获得锁。所以解锁的操作不能仅依赖用户控制，而是要给出系统级别的保底处理方案，即在获取锁之后立刻为锁设定时限，到一定时间仍不释放则释放锁。
```
expire lock-key second
pexpire lock-key millisecond
```
由于操作通常都是毫秒、微秒级别，所以锁定时间不宜过大，具体时间需要进行业务测试后确认，一般推荐设定为`业务的最大耗时*1.2+平均网络延时*1.1`。

## Redis删除策略
早些时候我们学习Redis通用指令时知道可以用expire设置过期时间，用ttl指令查看数据的状态，如果大于等于0则是有时效性的数据，如果为-1则是永久有效的数据，如果为-2则是已经过期的数据或者是被删除的数据或者是未定义的数据。

我们考虑一个问题：数据过期以后，会立即在内存中被删除吗？

CPU执行指令时由于删除操作（内存释放）的优先级往往没有get set操作优先级高，在内存充足的情况下可能不会立刻删除过期数据。Redis有三种删除策略：**定时删除、惰性删除、定期删除**。
删除策略的目标时在内存占用和CPU占用之间寻找一种平衡。

Redis的0~15号数据库中都有一块expires空间（hash结构），当我们设置数据的有效期后，会再该空间中存入数据的地址和过期时间。

### 定时删除
创建一个定时器，当key设置过期时间并达到过期时间时，由定时器任务立即执行对键的删除操作。优点在于省内存，缺点是无论CPU负载量如何都会占用CPU，会影响redis服务器的响应时间和指令吞吐量。

### 惰性删除
数据到达过期时间后不做处理，等下次访问该数据时如果未过期则返回数据，如果发现已过期则删除并返回不存在。这种方式是将所有的获取数据操作和expireIfNeeded()函数绑定，只要获取数组则之前都作检查。该策略节约CPU性能，缺点是内存压力很大。

### 定期删除
这是一种折中方案，Redis服务器初始化时，读取配置server.hz的值，默认为10。该值用于控制对服务器进行定时轮询的频度，每秒钟执行server.hz次serverCron()，进而通过databaseCron()对每一个db中的expires空间进行轮询，进而通过activeExpireCycle()对单个expires[i]进行检测，每次执行250ms/server.hz。随机挑选出W个key检测，如果检测到W中超过25%的key都过期被删除了，那么对expires[i]中剩余的key循环进行该操作。W的值在配置中由`ACTIVE_EXPIRE_CYCLE_LOOKUPS_PER_LOOP`配置。

定期删除周期性地轮询Redis库中的时效性数据，采用随机抽取的策略，利用过期数据占比的方式控制删除频度。CPU性能占用设置有峰值，检测频度可定义，内存压力不是很大，长期占用内存的冷数据会被持续清理。

## 逐出策略
Redis在执行每个命令前，会调用freeMemoryIfNeeded()检测内存是否充足，如果不满足新加入数据的最低存储要求，则要临时删除一些数据为当前指令清理存储空间。清理策略的数据称为逐出算法（也称淘汰算法）。逐出数据的过程并不一定能百分百成功，当对所有数据尝试完毕之后如果不能达到内存清理的要求，将出现错误信息。

与逐出策略相关的配置：
```
# 最大可使用内存 占用物理内存的比例，默认值为0表示不限制，根据需求设定
maxmemory 
# 每次选取待删除的数据个数，选取数据时如果全库扫描会导致严重的性能消耗
maxmemory-samples
# 删除策略
maxmemory-policy policy
```
删除策略的选择：
* 检测易失数据（可能会过期的数据集server.db[i].expires）
    * volatile-lru：挑选最近最少使用的数据（建议使用此项）
    * volatile-lfu：挑选最近使用次数最少的数据淘汰
    * volatile-ttl：挑选将要过期的数据淘汰
    * volatile-random：任意选择数据淘汰
* 检测全库数据（所有数据集server.db[i].dict）
    * allkeys-lru
    * allkeys-lfu
    * allkeys-random
* 放弃驱逐数据
    * no-enviction，Redis4.0以后的默认策略，可能引发OOM（OutOfMemory）

## Redis基础配置
```
# 设置服务器以守护进程的方式运行
daemonize yes|no
# 绑定主机地址，只有从绑定的地址才能访问服务器
bind 127.0.0.1
# 设置服务器端口号
port 6379
# 设置数据库数量
databases 16

# 设置日志的级别，默认为verbose，debug信息量更丰富，线上场景用notice即可，写日志要耗CPU性能
loglevel debug|verbose|notice|warning

# 同一时间内最大客户端连接数，默认0表示无限制。达到上限是Redis会关闭连接
maxclients 0
# 客户端闲置等待最大时长。关闭该功能则设置为0
timeout 300

# 多服务器快捷配置，导入并加载指定的配置文件信息，用于快速创建公共配置较多的实例配置文件
include /path/server-port.conf //相对路径和绝对路径均可
```

## Redis高级数据类型
所谓的高级数据类型其实是为了解决单一的业务问题而存在的。并不复杂，内容也比较简单

### Bitmaps
Redis中Bitmaps并不是一种全新的数据结构，就是基于string来的，只不过操作方式不同了。在一些编程语言中，我们想要用变量保存一些简单的二元状态值的话能操作的最小单位是字节，而从二进制层面看，1字节可以存储8位状态。基于这种思想我们在存储状态值时能更节省空间，只不过写入数据时需要计算出要修改哪一位，属于用时间换空间。

Bitmaps类型的基础操作：
```
# 获取指定key对应偏移量上的bit值
getbit key offset
# 设置指定key对应偏移量上的bit值，value只能是0或1
setbit key offset value
```
注意，如果没有设置过key或者没有设置过key上的某偏移量的话使用getbit得到的都是0；在setbit时，如果偏移量很大则Redis需要花很多时间把前面的为全部显式置为0，所以如果使用场景计数很大建议统一减去计数的最小值再setbit。

Bitmaps类型的扩展操作：
```
# 统计指定key中1的数量
bitcount key [start end]

# 对指定key按位进行交、并、非、异或操作，并将结果保存到destKey中
bitop and|or|not|xor destKey key1 [key2 ...]
```
使用场景：每天统计若干编好号的文件资源是否被访问过，一个月下来把每天的统计结果进行或操作就能知道哪些资源一个月内都没有人访问，可以删除之以节约空间。Bitmap只能统计是非状态，不能统计次数。

### HyperLogLog
该数据类型应用面更窄：统计不重复的数据的数量。

前面我们看过这样的一个场景：统计网站的独立用户访问量，当时使用的是set来存储每个用户的id（字符串）实现统计，学过Bitmap之后可以用bit来存储每个用户的状态是否访问，这样能带来一定的提升，但当用户量非常大时占用空间也很可观。

* HyperLogLog是用来进行基数统计的，基数就是数据集去重后的元素个数，它不是集合不保存数据，只记录数量所以比set和bitmaps存储效率高（每个HyperLogLog key占用了12KB的内存用于标记基数）；
* 其核心是基数估算算法，最终值存在一定误差（当数据量达到一定量级后估计结果是一个带有0.81%误差的近似值）

HyperLogLog类型的资本操作：
```
# 添加数据
pfadd key element [element ...] //该操作不是一次分配12K内存，会随着基数增加逐渐增大
# 统计数据
pfcount key [key ...]
# 合并数据
pfmerge destkey sourcekey [sourcekey ...] //合并后占用的存储空间为12K，无论之前存储空间是多少
```

### GEO
GEO类型用于计算地理位置，并且只适用于经纬度，海拔无法计算。

GEO类型基本操作：
```
# 添加坐标点经纬度
geoadd key longitude latitude member [longitude latitude member ...]
# 获取坐标点
geopos key member [member ...]
#计算坐标距离
geodist key member1 member2 [m|km|ft|mi 单位默认为m]

# 根据输入的经纬度坐标和半径求范围内有多少个点（移动导航场景）
georadius key longitude latitude radius m|km|ft|mi [withcoord] [withdist] [withhash] [count count]
# 根据已有的点求半径范围内有多少点（定外卖预先填好位置）
georadiusbymember key member radius m|km|ft|mi [withcoord] [withdist] [withhash] [count count]
# 获取指定点对应的坐标hash值
geohash key member [member ...]
```

# Redis集群
互联网服务要求“高并发”、“高性能”、“高可用”，高可用业界可用性目标为5个9，即全年服务可用时长达到99.999%。而单机的Redis存在以下风险与问题：
* 机器故障，例如硬盘故障、系统崩溃，可能造成数据丢失对业务造成灾难性打击。
* 容量瓶颈，内存不足，由于成本和硬件限制不可能无限升级内存

为了避免单点Redis服务器故障，准备多台服务器，互相连通。将数据复制多个副本保存在不同的服务器上，并保证数据是同步的。这就实现了Redis的高可用与数据的冗余备份。

## 主从复制
我们使用一台主服务器（master）专门负责收集数据（写），并使多台从服务器（slave）与主服务器同步数据，专门负责提供数据（读）。这时的核心工作就是数据从master到slave的复制过程。

主从复制就是将master中的数据即时、有效的复制到slave中，一个master有多个slave，一个slave只有一个master。其作用在于：
* 读写分离：提高服务器的读写负载能力
* 负载均衡：基于主从结构配合读写分离，由slave分担master的负载，并根据需求变化改变slave的数量，提高服务器的并发量与数据吞吐量。
* 故障恢复：当master出现问题，由slave提供服务，实现快速故障恢复。
* 数据冗余：实现数据的热备份，是持久化之外的一种数据冗余方式。
* 高可用基石：基于主从复制，构建哨兵模式与集群，实现Redis高可用方案。

主从复制过程大体可以分为3个阶段：
* 建立连接阶段（准备阶段）
* 数据同步阶段
* 命令传播阶段

### 工作流程：建立连接
1. 首先通过slave客户端向slave服务端发送指令`slaveof ip port`，slave服务端会向master服务端发送连接消息。master服务端接收到指令，响应对方。slave服务端保存master的IP与端口。
2. slave根据保存的信息创建连接master的socket。
3. slave还要周期性地发送命令ping，master响应pong
4. slave可能要发送指令auth password，master做一个验证授权
5. slave通过replconf listening-port port-number来告知master自己的监听端口，master保存slave的端口号。

至此主从连接成功，之间创建了连接的socket。

为了建立连接，可以在slave客户端使用指令`slaveof ip port`，也可以在slave服务器启动时用命令行参数传入`redis-server ./conf/redis-6380.conf --slaveof 127.0.0.1 6379`，但不推荐这两种方式，我们应该使用配置文件进行配置，直接添加`slaveof 127.0.0.1 6379`。

要断开连接的话，必然是从服务器断开，通过指令`slaveof no one`来断开。

授权访问相关的命令如下（即使不用主从模式配置密码后客户端连接也需要密码）：
```
# master配置文件设置密码
requirepass password
# master客户端命令设置密码
config set requirepass password
config get requirepass
# 启动客户端设置密码
redis-cli -a password

# slave客户端发送命令设置连接密码
auth password
# slave通过配置文件设置密码
masterauth password
```

### 工作流程：数据同步
1. slave端请求同步数据（向master发送指令psync2）
2. master创建RDB同步数据（master执行bgsave，第一个slave连接时创建指令缓冲区，生成RDB文件）并通过socket发送给slave，这时RDB文件中不包含缓冲区中可能不断到来的指令。
3. slave接收RDB，清空数据，执行RDB文件恢复过程【到此为止是全量复制】slave发送命令告知RDB恢复已经完成
4. slave请求部分同步数据，master复制缓冲区的指令信息再发送
5. slave恢复部分同步数据，slave接受信息实行bgrewriteaof，恢复数据。【增量复制】

说明：
1. 如果master数据量巨大，数据同步阶段应该避开流量高峰期，避免造成master阻塞，影响业务正常执行。
2. master复制缓冲区大小设定不合理会导致数据溢出。可以通过`repl-backlog-size`进行配置。
3. 为避免slave进行全量复制、部分复制时相应阻塞或者数据不同步，建议关闭此期间的对外查询服务。`slave-serve-stable-data yes|no`
4. 当有多个slave对master请求数据同步是，master发送的RDB文件增多，会对带宽造成巨大冲击。因此要根绝需求适当错峰。
5. slave过多是，建议调整拓扑结构，由一主多从变为树状结构，中间结点既是master也是slave。这种方式能缓解master压力，但深度越高的slave与顶层master之间数据同步延迟越大，数据一致性变差应谨慎选择。

### 工作流程：命令传播
在命令传播阶段如果出现了断网现象，闪断闪连可以忽略，短时间断网需要进行部分复制，长时间断网需要进行全量复制。

部分复制有三个核心要素：
* 服务器的运行id（run id）
* 主服务器的复制积压缓冲区
* 主从服务器的复制偏移量

服务器的运行id是40位16进制字符，每台服务器每次运行都会生成一个不同的运行id。被用在服务器间进行传输，识别身份。

复制积压缓冲区由偏移量和字节值组成，存储的是AOF格式的指令，通过offset区分不同的slave当前数据传播的差异，master和slave分别记录已发送信息和已接受信息的offset。

在数据同步过程中，详细传播的命令如下：
1. slave首次请求数据同步，发送`psync2 <runid> <offset>` 指令，由于此时master的runid和offset未知，所以发送`psync2 ? -1`；master收到指令后发现需要全量复制，则发送`+FULLSYNC runid offset`,通过socket发送RDB文件给slave。这期间由于master接收客户端命令，offset发声了变化。slave收到`+FULLSYNC`和master的runid和offset进行保存，并通过RDB文件恢复数据。
2. 之后slave向master发送`psync2 runid offset`，master接收命令，判定runid和自身是否匹配、offset是否在缓冲区中，如果有一个不满足则要进行全量复制；如果runid匹配、offset和master记录的相同则忽略；如果offset在缓冲区中但不相同则发送`+CONTINUE offset`，通过socket发送两边offset之间的数据。slave收到`+CONTINUE`指令后保存master的offset，接收信息并执行bgrewriteaof，恢复数据。完成后不断通过`replconf ack offset`向master报告自己当前的偏移量。

### 心跳机制
进入命令传播阶段时，master与slave间要进行信息交换，使用心跳机制进行维护，保持双方连接在线。
* master：指令为PING，用于判断slave是否在线，周期由`repl-ping-slave-period`决定，默认为10秒。
* slave：指令为REPLCONF ACK {offset}，周期为1秒，用于判断master是否在线，并向master汇报自己的复制偏移量，获取最新的数据变更指令。

当slave多数掉线，或延迟过高时，master为报障数据稳定性，将拒绝所有信息同步操作。
```
# 当slave数量少于2个或者所有slave的延迟都大于等于10s时，强制关闭master的写功能，停止数据同步
min-slaves-to-write 2
min-slaves-max-lag 10
```

### 主从复制的常见问题
* 频繁的全量复制
    * 伴随系统运行，master数据量增大，一旦master重启，runid将发生变化，会导致全部slave的全量复制操作。Redis内部有优化调整方案，关闭时执行命令 shutdown save，将runid和offset保存到RDB文件中，重启后加载RDB即可恢复runid和offset。
    * master缓冲区过小，同时网络环境不佳，断网重连后offset越界，触发全量复制，导致slave拒绝对外提供服务。修改缓冲区大小即可解决，大小设置为`2*重连平均时长*master平均每秒产生写命令数据总量`
* 频繁的网络中断
    * slave频繁断开连接重连，导致master各种资源被严重占用。可以设置合理的超时时间`repl-timeout`确认是否释放slave（默认为60s）。
    * slave连接断开，由于master设定的超时时间较短，而ping指令在网络中存在丢包。这时要提高ping指令发送的频度`repl-ping-slave-period`，超时时间`repl-time`应至少为频度的5到10倍否则容易判定slave超时。
* 多个slave获取相同的数据不同步
    * 优化主从间的网络环境

## 哨兵
如果Redis集群在运行过程中一台slave宕机，那么master可以通过心跳机制以及配置的超时策略来选择释放掉该slave，但是如果master宕机了我们要做的事情就没有这么简单：
* 将宕机的master下线
* 找一个slave作为新的master
* 通知所有slave连接新的master
* 启动新的master与slave
* 某些情况下可能会做N次全量复制和N次部分复制

那么就会产生这样的问题：
* 谁来确认master宕机了
* 如何确定新的master
* 修改主从配置后，原来的master恢复了怎么办？

哨兵（sentinel）就是负责监控主从结构中的每台服务器，并解决以上问题的一个分布式系统。起作用在于：
1. **监控**master和slave是否正常运行
2. **通知**，当被监控的服务器出现问题时，向其它（哨兵、客户端）发送通知
3. **自动故障转移**，断开master与slave连接，选取一个slave作为新的master，将其它slave连接到新的master，并告知客户端新的服务器地址

哨兵也是一台Redis服务器，只是不提供数据服务，通常哨兵配置数量为单数。在Redis根目录下提供了一份默认的配置，我们可以通过`cat sentinel.conf|grep -v "#"|grep -v "^$" > ./conf/sentinel-26379.conf`来将其中的主要内容写入到新的配置文件中并进行自定义（主要是配置哨兵端口和目录）。
```
port 26379
dir /root/redis-6.0.6/data
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel down-after-milliseconds mymaster 30000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 180000
```
快速拷贝并修改两份配置：
```bash
sed 's/26379/26380/g' sentienl-26379.conf > sentienl-26380.conf
sed 's/26379/26381/g' sentienl-26379.conf > sentienl-26381.conf
```
启动master和两个slave，之后使用`redis-sentinel 配置文件路径`来启动哨兵，这时我们再查看配置文件可以发现已经自动生成了一些信息。
```
port 26379
dir "/root/redis-6.0.6/data"
sentinel myid 4b06697560c18dd5f688d61f144b4959ac570136
sentinel deny-scripts-reconfig yes
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel config-epoch mymaster 0
# Generated by CONFIG REWRITE
protected-mode no
user default on nopass ~* +@all
sentinel leader-epoch mymaster 0
sentinel known-replica mymaster 127.0.0.1 6381
sentinel known-replica mymaster 127.0.0.1 6380
sentinel known-sentinel mymaster 127.0.0.1 26380 26a351452fe45246fd1557b95a215f2ed001ba00
sentinel current-epoch 0
```
包括当前哨兵的id和已知的主从服务器以及已知的其它哨兵，当我们手动Ctrl C关闭master之后，稍等片刻就能在各哨兵的控制台日志中看到sdown和重新选举新master的相关信息，并且在剩下的两台slave日志中也能看到它们首先是尝试重连旧的master，然后进行了config rewrite，其中被选为master的服务器切换到了master mode。

### 哨兵工作原理：监控阶段
同步各个节点的状态信息，获取各个sentinel的状态和master的状态（runid、role和各个slave的详细信息），从master那里拿到slave的信息后再连接slave获取slave的状态（runid、role、host、port、offset等等）。

工作顺序：
1. sentinel连接master发送info获得详细信息，为了方便后面的命令交换，与master建立cmd连接。
2. sentinel和master中的info维护了已知的所有master、slaves、sentinels。
3. sentinel根据拿到的信息，连接slave发送info获得详细信息。
4. 当有新的sentinel启动并从master那里拿到信息后，发现sentinels中有其它sentinel，则他们之间建立publish/subscribe连接保证信息的同步，新的sentinel也会连接所有slave。

### 哨兵工作原理：通知阶段
通知阶段是信息的长期维护阶段，任意的sentinel都会通过cmd连接获取到master和slave的工作状态，之后它会在sentinel之间传递这些信息。

### 哨兵工作原理：故障转移阶段
当一个sentinel发现向master发送hello消息得不到回应超过一定次数时，他就认为master宕机了，认为master状态为sdown（主观下线）并通知其它sentinel，当超过半数的sentinel都认为master宕机则状态变为odown（客观下线），该数字由配置中`sentinel monitor mymaster 127.0.0.1 6379 2`最后一个值确定。

之后sentinel之间要发起多轮领导者选举，每次发送自己的竞选次数和runid以及挂掉的masterIP和端口，如果一轮选举后没有sentinel得到半数以上投票，则进行下一轮，竞选次数+1。

选出的sentinel从服务器列表中挑选备选的master：
* 选中所有在线的
* 排除掉响应慢的
* 排除与原master断开时间久的
* 最后使用优先原则
    * 优先级
    * offset
    * runid

选出新的master后，向新的master发送slaveof no one，向其它slave发送slaveof 新masterIP与端口。之后就算原master重连，也将被转为slave。

## 集群
在业务发展中，随着业务量增大单台主服务器会遇到性能峰值瓶颈。集群就是使用网络将若干台计算机联通起来，并提供统一的管理方式，使其对外呈现单机的服务效果。集群的好处在于：
* 分散单台服务器的访问压力，实现负载均衡
* 分散单台服务器的存储压力，实现可扩展性
* 降低单台服务器宕机带来的业务灾难

### 集群存储结构设计
在前面的主从模式中，一个主服务器要负责所有数据的写入工作，而在集群中多个主服务器共同承担数据的写入。这些主服务器的所有存储空间被划分为16384份（每一份被称为槽）并编好号，当有一个key-value要存入时，首先通过CRC16算法得到一个hash值，该值再对16384取模来确定最终要存储的位置。

当新加入机器时，从原有的机器中取出一部分槽分给新机器。各个数据库相互通信，保存各个库中槽的编号数据，当有客户端请求数据时，如果一次命中直接返回，没有命中则告知其具体的存储位置。

### 搭建集群
依然来编辑配置文件，追加上：
```
cluster-enabled yes //开启集群模式
clutser-config-file node-6379.conf //集群配置文件
cluster-node-timeout 10000 //cluster下线的时间，一旦节点超时达到限制则认为已经下线
```
依次修改多个实例的配置并启动它们，这时我们查看进程能看到后面多了[cluster]标记
```bash
➜  conf ps -ef |grep redis-
root      3950  3516  0 10:11 pts/4    00:00:00 redis-server *:6379 [cluster]
root      3980  3567  0 10:11 pts/5    00:00:00 redis-server *:6380 [cluster]
root      3993  3618  0 10:12 pts/6    00:00:00 redis-server *:6381 [cluster]
root      4006  3675  0 10:12 pts/7    00:00:00 redis-server *:6382 [cluster]
root      4019  3728  0 10:12 pts/8    00:00:00 redis-server *:6383 [cluster]
root      4049  3779  0 10:13 pts/9    00:00:00 redis-server *:6384 [cluster]
root      4056  2398  0 10:13 pts/0    00:00:00 grep --color=auto --exclude-dir=.bzr --exclude-dir=CVS --exclude-dir=.git --exclude-dir=.hg --exclude-dir=.svn --exclude-dir=.idea --exclude-dir=.tox redis-
```
接下来进入到src目录，使用该目录下的redis-trib.rb来构建cluster集群：
```bash
# --replicas 后面的数字表示个主带几个从，后面的主机数量要对应起来，先输入所有的主再输入所有的从
➜  src ./redis-trib.rb create --replicas 1 127.0.0.1:6379 127.0.0.1:6380 127.0.0.1:6381 127.0.0.1:6382 127.0.0.1:6383 127.0.0.1:6384
```
Redis 6.0 中已经停止使用redis-trib.rb，全部相关的指令已经转移到redis-cli
```
redis-cli --cluster create 127.0.0.1:6379 127.0.0.1:6380 127.0.0.1:6381 127.0.0.1:6382 127.0.0.1:6383 127.0.0.1:6384 --cluster-replicas 1
```
输入yes回车后配置集群完毕，自动将16384个槽均分给了三个master，并且每个master和自己的slave建立了同步。这时我们看到./conf/node-63**.conf中已经更新了所有节点已知的其它节点信息。

### 集群中写入与获取数据
集群跑起来后，我们要连接6379这台主服务器并尝试写入数据：
```bash
➜  ~ redis-cli        
127.0.0.1:6379> set name wallace
(error) MOVED 5798 127.0.0.1:6380
```
可以发现不允许在6379这台服务器上写入，由name这一个key计算出来的槽应该在6380上。为了避免频繁切换连接不同端口的客户端，可以通过`redis-cli -c`进入集群模式：
```bash
➜  ~ redis-cli -c
127.0.0.1:6379> set name wallace
-> Redirected to slot [5798] located at 127.0.0.1:6380
OK
127.0.0.1:6379> get name
-> Redirected to slot [5798] located at 127.0.0.1:6380
"wallace"
```

### 主从下线与主从切换
当某个slave下线达到前面配置的timeout时长后，master就会将其标记为下线，该信息会在所有在线节点间同步；该slave再次上线后，其被标记的下线状态会被清除。少量slave下线不会对集群的运行产生重大影响。

当某个master下线后，其slave尝试每1s连接一次master，当达到超时时间后仍为连接成功则选举出新的master并将原来的master标记为`master,fail`；原master再次上线后与新master进行同步，状态变为slave。（可以在客户端内使用`cluster nodes`或直接查看配置文件node-63**.conf查看）

cluster节点的操作命令：
```
# 查看集群节点信息
cluster nodes
# 进入一个从节点，切换其主节点
cluster replicate <master-id>
# 发现一个新节点，新增主节点
cluster meet ip:port
# 忽略一个没有slot的节点
cluster forget <id>
# 手动故障转移
cluster failover
```

# 企业级解决方案
## 缓存预热
有时Redis服务器启动后很快发生宕机，可能是因为请求数量高、主从之间数据吞吐量较大、数据同步操作频度较高。有以下解决方案：

* 前置准备工作
    * 日常例行统计数据访问记录，统计访问频度高的热点数据
    * 利用LRU数据删除策略，构建数据留存队列（手工维护或结合storm与kafka）
* 准备工作
    * 将统计结果中的数据分类，根据级别，redis优先加载级别高的热点数据
    * 利用分布式多服务器同时进行数据读取，提速数据加载过程
* 实施
    * 使用脚本程序固定触发数据预热过程
    * 如果条件允许使用CDN效果会更好

缓存预热就是在系统启动前，提前将相关的缓存数据加载到缓存系统。避免用户请求时，先查询数据库再将数据缓存的问题。

## 缓存雪崩
问题现象：系统平稳运行中，忽然数据库连接量激增->应用服务器无法及时处理请求导致大量408、500错误->客户反复刷新页面获取数据->数据库崩溃->应用服务器崩溃，重启无效->Redis服务器崩溃->Redis集群崩溃->重启数据库后再次被瞬间流量放倒。

其背后的原因在于**在一个较短的时间内缓存中较多的key集中过期**，此周期内请求访问过期的数据，redis未命中就只能向数据库获取数据，而数据库无法及时处理大量请求，导致Redis这边大量请求被积压，二者都面临崩溃。重启后仍然面对缓存中无数据可以用的问题，重启效果不理想。

可能的解决方案（设计层面）：
* 更多的页面静态化处理，减少向缓存请求的数据量
* 构建多级缓存架构：Nginx缓存+redis缓存+ehcache缓存
* 检测MySQL严重耗时的业务进行优化，例如超时查询、检测耗时较高事务等
* 灾难预警机制，监控redis服务器性能指标
    * CPU占用、使用率
    * 内存容量
    * 查询平均响应时间
    * 线程数
* 限流、降级：短期内牺牲部分用户体验，限制部分访问，降低服务器压力。

具体来说，还可以：
* 切换LRU、LFU策略
* 数据有效期策略调整
    * 在业务层面对数据进行分类错峰，例如电商抢购分场进行
    * 过期时间使用固定时间+随机值的形式，稀释集中到期的key的数量
* 对于超热数据使用永久key
* 定期维护：自动和人工，对即将过期的数据做访问量分析，确认是否延时。
* （慎用）加锁

## 缓存击穿
问题现象：系统平稳运行中，数据库连接量瞬间激增，而Redis服务器无大量key过期、内存无波动、CPU正常，但是数据库崩溃了。

问题原因：Redis某个key过期了，该key访问量巨大。多个请求都未命中，Redis在短时间内发起了大量对数据库中同一数据的访问。

解决方案：
* 预先设定：指定若干热点数据（例如购物节主打商品），加大此类信息key的过期时长。
* 现场调整：监控访问量，对自然流量激增的数据延长过期时间或设置为永久key。
* 后台刷新数据：启动定时任务，在高峰期来临前，刷新数据有效期
* 二级缓存：设置不同的失效时间，保障数据不会同时被淘汰。
* 加分布式锁：防止被击穿，不过也是性能瓶颈，慎重使用。

缓存击穿的应对方案应该在业务数据分析和预防方面进行，配合运行监控调试与及时调整策略。单个key过期监控难度较高，配合雪崩处理策略即可。

## 缓存穿透
问题现象：系统平稳运行中，应用服务器流量随时间增量较大，Redis服务器命中率随时间逐步降低、内存平稳无压力，但Redis服务器CPU占用激增，数据库服务器压力激增甚至可能崩溃。排查发现出现了非正常的URL访问。

问题原因：非正常的URL访问的数据在Redis和数据库中都不存在，查询为null后Redis并不会持久化，导致反复访问数据库。可能出现了黑客攻击。

解决方案：
* 临时缓存查询结果为null的数据，长期使用定期清理（30~60s，最高5min）。但这种方法治标不治本，也可能没有足够的内存缓存大量不存在的数据。
* 白名单策略：
    * 提前预热各种分类数据id对应的bitmaps，id作为bitmaps的offset，相当于设置了白名单。请求正常数据时放行，请求异常数据时拦截（相当于加了拦截器，效率偏低）
    * 使用布隆过滤器（比bitmaps性能高一些）
* 实时监控redis命中率是否在业务正常范围内，波动超过一定范围使用黑名单进行防控。
* 对key加密：临时启用防灾业务key，对key进行业务层传输加密，使用校验程序校验过来的key。（例如每天随机分配60个加密串，挑选2~3个混淆到页面数据id中，发现过来的key不满足规则则驳回访问）

无论是黑名单还是白名单对系统都是压力，问题结束后应尽快解除。

## 性能监控
要监控的部分重要指标如下：
* 性能指标
    * latency Redis响应一个请求的时间
    * instantaneous_ops_per_sec 平均每秒处理请求总数，即QPS
    * hit rate 缓存命中率
* 内存指标
    * used_memory 已使用内存
    * mem_fragmentation_ratio 内存碎片率
    * evicted_keys 由于最大内存限制而被逐出的key的数量
    * blocked_clients 由于BLPOP、BRPOP等操作而被阻塞的客户端数量
* 基本活动指标
    * connected_clients 客户端连接数
    * connected_slaves slave数量
    * master_last_io_seconds_ago 最近一次主从交互之后的秒数
    * keyspace 数据库中key值总数
* 持久化指标
    * rdb_last_save_time 最后一次持久化的时间戳
    * rdb_changes_since_last_save 最后一次持久化以来数据库的更改数
* 错误指标
    * rejected_connections 由于达到maxclients限制而被拒绝的连接数
    * keyspace_misses key没有命中的次数
    * master_link_down_since_seconds 主从断开的持续时间

监控方式：
* 工具
    * Cloud Insight Redis
    * Prometheus
    * Redis-stat
    * Redis-faina
    * RedisLive
    * zabbix
* 命令
    * redis-benchmark
    * redis-cli
        * monitor
        * slowlog get|len|reset

使用自带的redis-benchmark来测试：
```
# 不带参数默认创建50个连接，共10000次请求对应的性能
redis-benchmark [-h] [-p] [-c <客户端连接数>] [-n <请求数>] [-k]
```