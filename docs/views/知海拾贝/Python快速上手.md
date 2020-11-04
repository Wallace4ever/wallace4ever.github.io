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

### 列表、元组和文件
Python的核心对象是数值、字符串、列表、元组、文件、集合和字典。

一、列表：list，是Python对象的一个有序序列，其中的对象可以是任意类型，并不要求类型必须一致。Java中的List使用了泛型，要求列表中的元素类型必须一致。

列表的创建要使用中括号将所有元素括起来，元素之间用逗号分隔。例如`team = ["Seahawks", 1024, "University"]`，列表的一些常用操作有：
* len(myList)，列表中元素的个数
* max(myList)/min(myList)，列表元素的最大/最小值（列表中必须是同类型的元素）
* sum(nums)，列表元素求和，元素必须是数字
* nums.count(num)，列表中对象出现的次数
* nums.index(num)，一个元素首次在列表中出现的位置
* nums.reverse()，将列表中的元素逆序
* nums.clear()，将列表中的元素清空
* nums.append(num)，将元素插入到列表末端
* nums.extend([num1, num2])，将新列表追加到已有列表尾部
* del nums[-1]，删除指定位置的元素
* nums.remove(nums)，删除指定元素的首次出现
* nums.insert(1,num)，在指定位置插入元素
* +，连接两个列表
* nums * 3，列表重复

```python
# 示例，输入5个成绩，去掉两个最低分后求平均值
my_list = [float(input("Enter your 1st grade:")),
           float(input("Enter your 2nd grade:")),
           float(input("Enter your 3rd grade:")),
           float(input("Enter your 4th grade:")),
           float(input("Enter your 5th grade:"))]
my_list.remove(min(my_list))
my_list.remove(min(my_list))
print("Average is:{0:.2f}".format(sum(my_list) / len(my_list)))
```
前面提到过字符串不能直接修改其中的单个字符，即`str[1] = 's'`这样的语句是不合法的，但列表是可以直接替换的，即`listName[1] = ‘"wallace"`这样的语句是没问题的。对应地，在Java的List中，我们只能调用list.set(index, E)来设置元素。

列表切片：和字符串一样列表也支持切片语法，del也可以从列表中直接删除一个切片`del listName[1:3]`，对于切片也可以再使用索引：
```python
myList = [1, 2, 3, 4, 5, 6]
print(myList[1:4][1:3])
# 输出为[3, 4]
```
* 用split()方法快速分割字符串得到列表：`wordList = sentence.split(' ')`，不填分隔字符串的话默认用空白符分割。
* 用join()方法连接列表中的元素得到字符串：`sentence = ' '.join(wordList)`。需要指定分隔的字符串。

二、文本文件：文本文件的所有行（移除最后的换行符）可以通过以下代码的形式放入一个列表中：
```python
infile = open("Data.txt", 'r')
sentenceList = [line.rstrip() for line in infile]
infile.close()
```

三、元组对象：与列表类似是有序序列，但不可以直接修改，没有append/extend/insert方法。除此之外，针对列表的其他函数和方法同样适用，元组中的元素可以索引、切片、连接和重复。定义元组一般用小括号，也可以不用括号：
```python
# 两种形式都可以
tupleA = ('a', 'b', 'c')
tupleB = 'a', 'b', 'c'
```
元组可以用于同时创建多个变量并赋值，或者同时给多个已有的变量赋新值：
```python
# 创建了三个变量并赋值，下面的括号都可以去掉
(a, b, c) = (5, 6, 7)

# 交换数值
x = 1
y = 2
x, y = y, x # 本质上是将元组(2, 1)赋值给了(x, y)
```
列表和元组可以互相作为列表和元组的元素，并通过多个中括号访问，和Java中的二维数组比较类似。如果L是由元组构成的列表，那么L[-1][-1]就表示最后一个元组的最后一个元素。

列表是可变对象，但是数值、字符串和元组是不可变对象，对后者的操作均会在内存中分配新的区域来存放结果。如果变量var1是一个可变对象（如list），那么形如var2 = var1的语句会将var2的引用指向var1的同一个对象，对var2的修改会影响到var1的值。使用var2 = list(var1)或者var2 = var1[:]可以避免这种影响。列表和元组不允许索引越界，但可以允许切片索引越界。