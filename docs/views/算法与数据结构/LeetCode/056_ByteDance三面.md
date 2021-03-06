---
title: 【每日算法Day 56】正整数区间内不含3 5 8数字的数的总数
date: 2020-07-26
tags:
 - 算术
categories:
 -  LeetCode
---

## 题目描述
给出正整数区间[a,b]，给出区间中每一个字面不含 3、 5、 8 的数字的总数。

## 解题思路
直接遍历区间内的每一个数并判断其是否包含3、5、8的暴力解法是不能满足面试官要求的。

尝试使用一张表记录0~10、0~100、...、0~10^k（k为十进制数b的十进制位数）中包含3、5、8数字的数量，接下来分别处理a和b。对于一个边界例如6954，依次处理其每一位数字对应的范围中符合要求的数的数量（0~4中+0~50中+0~900中+0~6000中）。不过该解法最后似乎还存在一些边界问题，惭愧没能做到最好。
```java
public class Solution {
    //备查表，table[i]表示0到1*power(10,i)范围内包含数字 3 5 8 的整数个数
    private static int[] table;

    public static void main(String[] args) {
        System.out.println(count(0,33));
        System.out.println(count(0,76954));
        System.out.println(count(76952,76954));
    }

    //调用的方法接口，找到(a,b)开区间内包含数字 3 5 8 的整数个数
    public static int count(int a ,int b){
        int temp=b,bit=0;
        while(temp!=0){
            temp/=10;
            bit++;
        }
        table=bit>2?new int[bit+1]:new int[3];
        table[0]=0;
        table[1]=1;
        table[2]=3;
        table=prepare(bit,table);
        //得到的是[0,b]闭区间减去[0,a]闭区间内包含目标数的数量
        return getContainCount(b)-getContainCount(a);
    }

    //得出0到当前数字中包含3 5 8 的数字的个数
    private static int getContainCount(int a){
        int countA=0,bitOfA=1;
        while(a!=0){
            int curr=a%10;
            int sum=0;
            if(curr>=8){
                sum=3*(int)Math.pow(10,bitOfA-1)+(curr-3)*table[bitOfA-1];
            }else if(curr>=5){
                sum=2*(int)Math.pow(10,bitOfA-1)+(curr-2)*table[bitOfA-1];
            }else if(curr>=3){
                sum=(int)Math.pow(10,bitOfA-1)+(curr-1)*table[bitOfA-1];
            }else{
                sum=curr*table[bitOfA-1];
            }
            countA+=sum;
            bitOfA++;
            a/=10;
        }
        return countA;
    }

    //准备表
    private static int[] prepare(int height,int[] table){
        if(height>=3){
            table=prepare(height-1,table);
            table[height]=3*(int)Math.pow(10,height-2)+7*table[height-1];
        }
        return table;
    }
}
```

很遗憾，该思路不正确
```java
public int getCount(int a, int b) {
    int indexA = 0, indexB = 0;
    int[] arrA = new int[10], arrB = new int[10];
    while ( a > 0) {
        arrA[indexA++] = a % 10;
        a /= 10;
    }
    while ( b > 0) {
        arrB[indexB++] = b % 10;
        b /= 10;
    }
    return getCountFrom0(arrB, indexB - 1) - getCountFrom0(arrA, indexA - 1) + 1;
}

private int getCountFrom0(int[] arr, int index) {
    int result = 0;
    while (index >= 0) {
        int qualifiedNumbers = 0;
        if (arr[index] < 3)
            qualifiedNumbers = arr[index];
        else if (arr[index] < 5)
            qualifiedNumbers = arr[index] - 1;
        else if (arr[index] < 8)
            qualifiedNumbers = arr[index] - 2;
        else
            qualifiedNumbers = arr[index] - 3;
        result += qualifiedNumbers * (int) Math.pow(7, index);

        if (arr[index] == 3 || arr[index] == 5 || arr[index] == 8)
            Arrays.fill(arr, 0, index, 9);
        index--;
    }
    return result + 1;
}
```