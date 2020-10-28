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

## Python的变量
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