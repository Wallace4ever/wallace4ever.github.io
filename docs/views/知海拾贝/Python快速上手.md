---
title: Python快速上手
date: 2020-10-27
tags:
 - Python
categories:
 - 知海拾贝
---
:::tip
毕业设计计划用到Hadoop进行海量数据的处理，而预处理部分将会使用Python来处理抓的流量数据。本科没有Python课程，上次接触Python还是大三那时候零零散散地看了一些。不过Python诞生地初衷就是成为一门易用地语言，就让我们一起快速上手。
:::
<!-- more -->

## 第二章、核心对象、变量输入和输出
在Python中，我们在定义变量时不需要显式地指明变量的数据类型，解释器会自动推断数据类型，例如：
```python
price = 1.5
is_male = True
```
在Java中，我们有基础数据类型（boolean/byte/short/int/long/float/double/char）和引用数据类型。而Python中只有两大类数据类型：
* 数字型
    * 整形
    * 浮点型
    * 布尔型（非0即真）
    * 复数型（主要用于科学计算）
* 非数字型
    * 字符串
    * 列表
    * 元组
    * 字典
使用`type()`函数可以查看变量的数据类型。

### 数值
Python中带有小数点的数字就是浮点型，形如34.和.5这样的都是浮点型，Python中的数字没有整形和长整形、单精度和双精度这样的界定。

Python中的数学运算也是用`+-*/`来表示，并且内置了幂运算符`**`很方便，Python的除法运算结果通常是浮点型（即使商是一个整数），其他的运算中只要有1个操作数是浮点型结果就是浮点型，否则结果为整形。而Java中则需要调用Math.pow(base,power)来计算，并且如果是计算两个正整数的幂还需要对结果进行强制转型。

Python还支持整除运算`//`与求余运算`%`，并且以上所有运算均支持增量赋值，形如`a += b` `a -= b` `a //= b` `a %= b`。

一些内建函数：
* print()函数，可以支持输出多个用逗号分隔的变量，输出时自动用空格分隔并且会触发一次换行操作
* abs()函数，求绝对值
* int()函数，解析整数的字符串表示形式或截掉浮点数的小数部分
* float()函数，解析浮点数的字符串表示形式
* round()函数，四舍五入，如果遇到0.5这样的中间值，则结果为最近的偶数。

内存中的数值对象：

不同于Java中的基本数据类型在初始化后可以直接在原内存位置更改其数值，Python中的数值更类似于Java中数值型的封装类的对象。考虑下面的两行代码：
```python
n = 5
n = 7
```
在执行第一行代码时，Python分配了一块内存保存数字5，n可以看做是引用，指向该块内存地址。在执行第二行代码时，又分配了一块新内存保存数值7（而不是改动原有的内存区域）并将n重新指向新的内存地址。最终通过垃圾回收进程将孤立的数值从内存中删除。

### 字符串
Python中不区分字符和字符串，统称为字符串，并且使用一对单引号或双引号均可以表示（使用单引号时双引号可以出现在字符串中，反之亦然）。通常我们使用单引号表示单个字符的字符串，使用双引号表示多个字符的字符串，使用转义字符表示我们想要的符号。

字符串索引：在Java中我们想要访问某个字符串特定位置的字符时需要使用"str".charAt(index)方法或者通过toCharArray()方法转成字符数组才可以，而Python中支持通过索引直接访问，并且支持负数索引（表示倒数）。正数索引从0开始，负数索引从-1开始表示倒数第一个子字符串。字符串中的字符是无法直接修改的如`str[i] = 'p'`是错误的。

字符串切片：切片的写法为str[i:j]左闭右开，类似于Java中的"str".subString(i,j)。但后者不允许索引越界，前者在越界时（或者i >= j时）只会保留没有越界的部分而不会抛出异常，并且i和j是非必须的，如果省略那就默认为左边界或右边界。
```python
# 示例
myStr = "python"
print(myStr[1], myStr[2:4], myStr[-1], myStr[-5:-2], myStr[2:], myStr[:4], myStr[:])
# 输出
# y th n yth thon pyth python
```
字符串连接：Python支持使用加号进行两个字符串之间的连接（和Java类似），还支持使用`myStr * n`的形式重复连接n个myStr（Java不支持），但Java可以连接字符串和其他基本类型数据而Python不可以。

一些相关的内建函数：
* len(myStr)，得到字符串中字符的数目
* myStr.upper()/myStr.lower()，将字符串所有字符全部转为大写/小写
* myStr.count(subStr)，统计非重叠子串的数目，例如`print("ttt".count("tt"))`的结果是1
* myStr.capitalize()，首字母大写，其余字母小写
* myStr.title()，字符串中的每个单词首字母大写，其他字母小写
* myStr.lstrip()/.rstrip()/.strip()，移除字符串首/尾/首尾的空白字符
* int(myStr)/float(myStr)，前面提到过，解析字符串为对应的数值
* eval(myStr)，计算myStr代表的表达式，结合input()函数可以实现计算用户输入的表达式
* str(intValue/floatValue)，类似于Java中的toString()方法，转成字符串

Python代码行延续：Python是对代码格式要求比较严格的语言，可以使用反斜线或括号来分割代码行。
```python
message = "hello world"
message = "hello \
world" # 这一行前面的空格会算入字符串
message = "hello " + \
          "world"
message = ("hello " +
            "world")
```

### 输入与输出
使用input(prompt)函数得到的输入总是字符串，其中输入提示prompt是可选的，需要结合int()/float()函数进一步解析，这一点就不像Java中提供的格式化输入输出流可以直接指定。

print()函数：前面提到过，print()函数如果输出多个变量，默认的分隔符是空格，默认的结束符是回车，我们可以在其参数中加上可选参数sep和end来自定义。
```python
print(1, "two", 3, sep=",", end="    ")
print("new line")
'''
输出：
1,two,3    new line
'''
```
输出对齐：输出时还可以通过str.ljust(n)/str.rjust(n)和str.center(n)来设置文本在指定长度的域内对齐。
```python
print("Rank".ljust(5), "Player".ljust(20), "Score".rjust(3), sep="")
print("1".center(5), "Wallace Xu".ljust(20), "97".rjust(3), sep="")
print("2".center(5), "Vincent Yang".ljust(20), "88".rjust(3), sep="")
print("3".center(5), "Daniel Chan".ljust(20), "83".rjust(3), sep="")
'''
输出：
Rank Player              Score
  1  Wallace Xu           97
  2  Vincent Yang         88
  3  Daniel Chan          83
'''
```
使用"{0:格式}...{1:格式}".format(targetStrs ...)来以指定的多个格式化串对目标字符串或数字进行格式化。示例：
```python
print("The area of {0:s} is {1:,d} square miles.".format("Texas", 268820))
print("The population of {0:<s} is {1:.2%} of the U.S. population.".format("Texas", 26448000 / 309000000))
'''
输出：
The area of Texas is 268,820 square miles.
The population of Texas is 8.56% of the U.S. population.
'''
```
其中大括号为占位符，前面的数字加冒号对应着后面format的参数序号，冒号后是真正的格式化字符串。可以用`<^>`三个字符分别指定对齐方式，可以接正整数表示对齐域的宽度。最后一位表示数据类型，n表示任意数字，d表示整数，f表示浮点数，%表示百分数，s表示字符，如果是任意一种数字可以接`,`表示添加千位符，如果是浮点数和百分数可以加`.n`表示保留小数点后n位。