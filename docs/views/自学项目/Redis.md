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

### String类型
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