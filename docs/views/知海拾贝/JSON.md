---
title: JSON简要说明
date: 2021-01-12
tags:
 - JSON
categories:
 - 知海拾贝
---
:::tip
JSON取代了XML成为了最受欢迎的用于网络传输的信息交换格式，已经独立于JavaScript语言在很多场景中得到使用，其实并不复杂。
:::

## 简介

JSON的全称是JavaScript Object Notation（JavaScript 对象表示法），是一种用于高效数据交换的轻量级文本格式，是JavaScript对象的字符串表示法。和XML相比，JSON有着更小、更快，更易解析的特点。

## JSON语法

JSON 语法是 JavaScript 对象表示语法的子集。

在JavaScript语言中，一切都是对象，因此任何JavaScript支持的类型都可以通过JSON来表示。JSON的要求和语法格式为：
* 对象表示为键值对
* 数据由逗号分隔
* 大括号保存对象
* 中括号保存数组

JSON的值（value）可以是：
* 双引号括起来的字符串
* 数值（整数或浮点数）
* true/false/null
* 用大括号括起来的对象，对象是无序的键值对集合
* 用中括号括起来的数组，数组是有序的值的集合

并且这些结构可以嵌套。

## 示例

JSON键值对的写法和JS差不多，键和值都用双引号包括，之间用冒号隔开：
```json
{"name" : "wallace"}
{"age" : 3}
{"sex": "male"}
```
举个例子来说明JavaScript和JSON的关系：
```javascript
var obj = {a: 'Hello', b: 'World'}; //这是一个JavaScript对象
var json = '{"a": "Hello", "b": "World"}'; //这是将上面的对象转成的字符串，字符串内容是JSON

//两者在JavaScript中实现相互转换
var obj = JSON.parse('{"a": "Hello", "b": "World"}'); //从JSON字符串转为JS对象
var json = JSON.stringify({a: 'Hello', b: 'World'}); //从JS对象转为JSON字符串
```
