---
title: 多元素和为K的整倍数问题
date: 2020-05-13
tags:
 - Java
 - 数据结构
categories:
 -  LeetCode
---

# 求集合中和为K的整倍数的元素组合的个数
遇到多个元素和整倍数的问题，可以尝试通过哈希寻找符合条件的数值组 ，我们来看两题：

## LeetCode 1010 总持续时间可被 60 整除的歌曲

> 在歌曲列表中，第 i 首歌曲的持续时间为 time[i] 秒。返回其总持续时间（以秒为单位）可被 60 整除的歌曲对的数量。形式上，我们希望索引的数字 i 和 j 满足  i < j 且有 (time[i] + time[j]) % 60 == 0。（即先后顺序反过来也只算一对）

思路：使用数组count[60]（HashMap也可以，Map的key就对应数组的下标0-59）作为哈希表来存储每首歌除60的余数的计数。count[i]表示time[]数组中对60取模结果为i的歌曲的数量，除了count[0]和count[30]外，count[i]和count[60-i]的乘积就是匹配的歌曲对数目
为避免重复计算歌曲对，下标从1-29进行计算，而count[0]和count[30]中，各自取任意两首歌曲组合都满足要求，则计数为n(n-1)/2。

````Java
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

<!--more-->

##  连续的子数组和
> 给定一个包含非负数的数组和一个目标整数 k，编写一个函数来判断该数组是否含有连续的子数组，其大小至少为 2，总和为 k 的倍数，即总和为 n*k，其中 n 也是一个整数。

这一题虽然官方归在DP问题里面，但解法却和第1010有相似之处，只是包装得更深。
这一题LeetCode官方给出的几种解法和一些他人的题解中没有看到显式的递归（虽然不少问题中递归与循环是可以相互转化的）
可能是我之前对动态规划的核心思想理解有误，之前在《数据结构与算法经典问题解析Java语言描述》中看到DP的定义是1.递归求解子问题+备忘录存储已经计算的值
相较于循环，递归有时会增加时间复杂度，有时则不会；而对于存在重复计算子问题的情况，备忘录/记忆化的方式能显著降低时间复杂度
现在看来后者是DP思想的核心，而递归却不是必需的。

在1010题中，想要找到总时间长度为60s的整倍数的歌曲对，则将每首歌曲对60取余数并存储至数组中（HashMap也可），两首余数相加=60的歌曲总长度满足条件
而本题中加法不限于2目（2首），是任意长度的连续子数组都可以相加，则如何通过记忆化的方式快速得出任一子数组元素的和成为关键问题

````Java
public class No523_ContinuousSubarraySum {
    //暴力解法，计算每个子数组的元素和，对k取余数为0则返回true,复杂度为O(n^2)
    public boolean checkSubarraySum1(int[] nums, int k) {
        //防御性编程部分
        if (nums==null||nums.length<2) return false;
        if (k == 0) {
            for (int i = 0; i < nums.length - 1; i++) {
                if (nums[i]==0&&nums[i+1]==0) return true;
            }
            return false;
        }

        for (int start = 0; start < nums.length - 1; start++) {
            //使用O(1)的额外空间存储nums[i]到nums[j]的和
            int sum=nums[start];
            for (int end = start + 1; end < nums.length; end++) {
                sum+=nums[end];
                if (sum%k==0) return true;
            }
        }
        return false;
    }

    //尝试通过记忆化的方式避免重复计算子问题，
    public boolean checkSubarraySum2(int[] nums, int k) {
        //防御性编程部分
        if (nums==null||nums.length<2) return false;
        if (k == 0) {
            for (int i = 0; i < nums.length - 1; i++) {
                if (nums[i]==0&&nums[i+1]==0) return true;
            }
            return false;
        }

        //sums[i]存储的是nums[0]+nums[1]+...+nums[i]的值（前缀和），则要计算nums[i]到nums[j]的和可以直接用sums[j]-sum[i]+nums[i]
        //这里使用了O(n)的空间来试图快速计算子数组的元素和
        int[] sums=new int[nums.length];
        sums[0]=nums[0];
        for (int i = 1; i < sums.length; i++) {
            sums[i]=sums[i-1]+nums[i];
        }
        for (int start = 0; start < nums.length - 1; start++) {
            for (int end = start + 1; end < nums.length; end++) {
                //但由于依然要使用两个嵌套for来分别确定子数组的起始坐标，时间复杂度仍然为O(n^2)
                if ((sums[end]-sums[start]+nums[start])%k==0)
                    return true;
            }
        }
        return false;
    }

    //使用散列（数组和HashMap均可）,结合取模来寻找，类比1010的思想，但这里取模的不是nums中某一元素的值，而是sums中存储的前缀和
    //对sums[i]%k得到的结果result表示nums[0]~nums[i]的和k的某倍数的距离，而如果后面某一j也有nums[0]~nums[j]和k的某倍数的距离也为result,则i~j间的元素和为k的整数倍
    //这时就可以一边计算sums一边插入到散列中，发现有重复的则说明存在满足条件的子数组
    //前两种解法对k取模只是用在最终直接判断子数组元素和是否满足条件，而题目只问是否存在（1010中只问存在多少对），都没有直接问是哪些
    public boolean checkSubarraySum3(int[] nums, int k) {
        if (nums==null||nums.length<2) return false;
        for (int i = 0; i < nums.length - 1; i++) {
            if (nums[i]==0&&nums[i+1]==0) return true;
        }
        if(k==0) return false;

        //自己手动管理Hash，踩了很多坑。最后一次用例[0,1,0,3,0,4,0,4,0]，5应为false，但输出为true，调不动了
        k=Math.abs(k);
        int hash[] =new int[k];
        int sum=0;
        for (int i = 0; i < nums.length; i++) {
            sum+=nums[i];//前缀和
            if (sum%k==0)return true;
            if(nums[i]==0)continue;
            if (hash[sum % k] ==0) {
                hash[sum % k] = i;
            } else if((i-hash[sum%k])!=1){
                return true;
            }
        }
        return false;
    }

    //官方直接使用HashMap
    public boolean checkSubarraySum(int[] nums, int k) {
        int sum = 0;
        HashMap < Integer, Integer > map = new HashMap< >();
        //这一步可以应对[k*i,j*i] i，官方只讲了大概思路，对这里语焉不详
        map.put(0, -1);
        for (int i = 0; i < nums.length; i++) {
            sum += nums[i];
            if (k != 0)
                sum = sum % k;
            //如果map中已有该余数，且对应的i与当前i的距离超过1的话则存在（等于则只是单个值是k的倍数，题目要求子数组至少2个数）
            if (map.containsKey(sum)) {
                //距离为1则什么都不做，保留上一次插入的i
                if (i - map.get(sum) > 1)
                    return true;
            } else
                map.put(sum, i);
        }
        return false;
    }
}
````
