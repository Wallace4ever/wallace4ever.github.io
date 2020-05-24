---
title: 使用VuePress的第一篇文章
date: 2020-05-24
tags:
 - Java
 - 数据结构
categories:
 -  配置折腾
---

::: tip
hello
:::

# 一级标题

## 测试文字

职位描述

1) 学习并逐步参与内部平台或业务软件日常开发和维护，如JAVA Web前后端、数据库、Android、iOS客户端等应用，具体工作如内部平台或业务系统的搭建和演示、微服务或Restful接口的封装、数据库库表的设计，客户端界面和接口逻辑、自动化脚本、金融智能算法系统搭建等工作的一种或者更多；
<!-- more -->
2) 跟踪国内外一线互联网和金融公司最新技术趋向，参与移动App前后台、人工智能平台、高速交易、智能投顾、金融舆情分析、资讯平台、风控等应用系统的最新规划、设计和开发，持续创新输出创意并孵化产品。

> 学术就是包装

````java
public class No1010_PairsOfSongs {
    public int numPairsDivisibleBy60(int[] time) {
        int[] count=new int[60];
        for(int i=0;i<time.length;i++){
            count[time[i]%60]+=1;
        }
        int couples;
        couples=count[0]*(count[0]-1)/2+count[30]*(count[30]-1)/2;
        for(int i=1;i<=29;i++){
            couples+=count[i]*count[60-i];
        }
        return couples;
    }
}
````

## 二级标题

### 三级标题