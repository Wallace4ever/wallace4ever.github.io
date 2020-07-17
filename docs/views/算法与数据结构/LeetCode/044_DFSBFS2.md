---
title: 【每日算法Day 44】DFS&BFS 2
date: 2020-07-14
tags:
 - DFS
categories:
 - LeetCode
---
:::tip
遇到最短路径、最短转换长度的问题首先想到的就是BFS，可以尝试将其转变为树/图并使用BFS来解决。
:::
<!-- more -->

## [LeetCode 127. 单词接龙](https://leetcode-cn.com/problems/word-ladder)
### 题目描述
给定两个单词（beginWord 和 endWord）和一个字典，找到从 beginWord 到 endWord 的最短转换序列的长度。转换需遵循如下规则：

每次转换只能改变一个字母。
转换过程中的中间单词必须是字典中的单词。
说明:

如果不存在这样的转换序列，返回 0。
所有单词具有相同的长度。
所有单词只由小写字母组成。
字典中不存在重复的单词。
你可以假设 beginWord 和 endWord 是非空的，且二者不相同。

### 示例
```
输入:
beginWord = "hit",
endWord = "cog",
wordList = ["hot","dot","dog","lot","log","cog"]

输出: 5

解释: 一个最短转换序列是 "hit" -> "hot" -> "dot" -> "dog" -> "cog",
     返回它的长度 5。。
```

### 解题思路
我们将字典wordList中每一个单词看作一个节点，将只有1个字母不相同的单词连接起来，这样就形成了一张无向图。我们从beginWord出发进行BFS，当遍历到的单词和endWord相同时，广度优先遍历的层数就是转换序列的长度。

另外，在进行BFS之前需要对输入的单词列表进行预处理，因为要找与某一个单词只相差一个字符的单词如果每次都遍历列表并比较的话时间开销会很大，这时可以建立一个字典，以每一个单词可能匹配的模式为key（例如abc匹配`*bc`、`a*c`、`ab*`），所有吻合该模式的单词列表为value，这样如果两个不同的单词匹配同一个模式，那么说明这两个单词间有一条长度为1的转换序列。

还需要一个Set来标记一个单词是否已经访问过，如果BFS过程中访问过该节点那么就不再访问。
```java
public int ladderLength(String beginWord, String endWord, List<String> wordList) {
    final int L = beginWord.length();
    //预处理：建立字典，内容为模式到所有匹配该模式的单词表的映射
    Map<String, List<String>> dict = new HashMap<>();
    wordList.forEach(word->{
        for (int i = 0; i < L; i++) {
            String mode = word.substring(0, i) + "*" + word.substring(i + 1, L);
            List<String> list = dict.getOrDefault(mode, new ArrayList<>());
            list.add(word);
            dict.put(mode, list);
        }
    });

    //BFS需要借助的队列
    Queue<String> queue = new ArrayDeque<>();
    queue.offer(beginWord);

    Set<String> visited = new HashSet<>();
    visited.add(beginWord);

    //BFS搜索到的深度，每搜索完一层就+1
    int depth=1;
    while (!queue.isEmpty()) {
        //记住当前层一共有多少节点，因为后面会不断加入下一层新节点
        int size = queue.size();
        while (size > 0) {
            String currentWord = queue.poll();
            size--;
            //获得当前队首单词的每一种模式
            for (int i = 0; i < L; i++) {
                String mode = currentWord.substring(0, i) + "*" + currentWord.substring(i + 1, L);
                //对于一种模式，查询到包含所有匹配单词的列表
                for (String potentialMatch : dict.getOrDefault(mode, new ArrayList<>())) {
                    //如果列表中有目标单词，则说明当前单词可通过一次改变字母变成目标单词
                    //（因为当前单词必然不同于目标单词）
                    if (potentialMatch.equals(endWord)) {
                        return depth+1;
                    } else if (!visited.contains(potentialMatch)) {
                        //否则确保访问过的单词不会再被访问
                        visited.add(potentialMatch);
                        //并且将当前单词添加到搜索路径中，进入到BFS下一层搜索
                        queue.offer(potentialMatch);
                    }
                }
            }
        }
        depth++;
    }
    return 0;
}
```
该算法的空间复杂度为`O(L*N)`，字典dict需要记录N个单词中每个单词的L种模式与单词的映射，BFS队列最多存放N个单词（实际上达不到N），visited集合的大小最多为N。时间复杂度为`O(L*N)`，从代码中的循环就能看出需要对N个单词做L次操作。

在前面的基础上，如果从beginWord和endWord开始进行同步的双向BFS，则可以一定程度上减少搜索空间和时间。

## [LeetCode 126. 单词接龙 II❌](https://leetcode-cn.com/problems/word-ladder-ii/)
### 题目描述
在前面的基础上，找出所有从 beginWord 到 endWord 的最短转换序列。
### 示例
```
输入:
beginWord = "hit",
endWord = "cog",
wordList = ["hot","dot","dog","lot","log","cog"]

输出:
[
  ["hit","hot","dot","dog","cog"],
  ["hit","hot","lot","log","cog"]
]
```

### 解题思路
在前一题的基础上，需要保存访问过的路径。在DFS中，当前路径可以借由调用栈进行传递，但是在BFS中就需要在节点入队列时封装上该节点所在的路径（`Queue<LinkedList<String>>`）。

还有问题的解法，由于时全路径搜索，某些测试用例会超时：
```java
public List<List<String>> findLadders(String beginWord, String endWord, List<String> wordList) {
    List<List<String>> lists=new ArrayList<>();
    if (!wordList.contains(endWord)) return lists;
    final int L = beginWord.length();
    //预处理：建立字典，内容为模式到所有匹配该模式的单词表的映射
    Map<String, List<String>> dict = new HashMap<>();
    wordList.forEach(word->{
        for (int i = 0; i < L; i++) {
            String mode = word.substring(0, i) + "*" + word.substring(i + 1, L);
            List<String> list = dict.getOrDefault(mode, new ArrayList<>());
            list.add(word);
            dict.put(mode, list);
        }
    });

    //BFS需要借助的队列
    Queue<LinkedList<String>> queue = new ArrayDeque<>();
    LinkedList<String> path = new LinkedList<>();
    path.addLast(beginWord);
    queue.offer(path);

    //这里再用一个全局的visited就不合适咯
    Set<String> visited = new HashSet<>();
    visited.add(beginWord);
    
    boolean reachMinDepth=false;
    while (!queue.isEmpty()) {
        //记住当前层一共有多少节点，因为后面会不断加入下一层新节点
        int size = queue.size();
        while (size > 0) {
            LinkedList<String> currPath = queue.poll();
            String currentWord=currPath.peekLast();
            size--;
            //获得当前队首路径最后一个单词的每一种模式
            for (int i = 0; i < L; i++) {
                String mode = currentWord.substring(0, i) + "*" + currentWord.substring(i + 1, L);
                //对于一种模式，查询到包含所有匹配单词的列表
                for (String potentialMatch : dict.getOrDefault(mode, new ArrayList<>())) {
                    //如果列表中有目标单词，则说明当前单词可通过一次改变字母变成目标单词（因为当前单词必然不同于目标单词）
                    if (potentialMatch.equals(endWord)) {
                        reachMinDepth=true;
                        currPath.addLast(endWord);
                        lists.add(currPath);
                    } else if (!visited.contains(potentialMatch)) {
                        //如果像上一题一样加入，会使得部分路径搜索不完全
                        //visited.add(potentialMatch);
                        //并且将当前单词添加到搜索路径中，进入到BFS下一层搜索
                        LinkedList<String> nextPath=new LinkedList<>(currPath);
                        nextPath.addLast(potentialMatch);
                        queue.offer(nextPath);
                    }
                }
            }
        }
        //当前层已经找到最短路径，直接返回结果
        if (reachMinDepth)
            return lists;
    }
    return lists;
}
```