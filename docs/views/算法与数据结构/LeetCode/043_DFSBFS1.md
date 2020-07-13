---
title: 【每日算法Day 43】DFS&BFS 1
date: 2020-07-13
tags:
 - DFS
categories:
 - LeetCode
---
:::tip
前面做过一些回溯相关的题目后，对DFS的理解加深了。二叉树的各种遍历也涉及DFS和BFS，可以结合起来看一看相关问题。
:::
<!-- more -->

## [LeetCode 200. 岛屿数量](https://leetcode-cn.com/problems/number-of-islands)
### 题目描述
给你一个由 '1'（陆地）和 '0'（水）组成的的二维网格，请你计算网格中岛屿的数量。

岛屿总是被水包围，并且每座岛屿只能由水平方向或竖直方向上相邻的陆地连接形成。

此外，你可以假设该网格的四条边均被水包围。

### 示例
```
输入:
[
['1','1','1','1','0'],
['1','1','0','1','0'],
['1','1','0','0','0'],
['0','0','0','0','0']
]
输出: 1
```

### 解题思路
遍历矩阵中的节点，每遇到一个1就增加一个岛屿计数并开始DFS，在DFS过程中，把访问过的陆地改为2，而只对值为1（没有访问过）的点进行DFS。最终返回总共的岛屿计数。
```java
public class No200_NumberOfIslands {
    private final int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int count=0;
        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[0].length; j++) {
                if (grid[i][j] == '1') {
                    count++;
                    dfs(grid, i, j);
                }
            }
        }
        return count;
    }

    private void dfs(char[][] grid, int i, int j) {
        grid[i][j]='2';
        for (int[] dir : dirs) {
            int x = i + dir[0], y = j + dir[1];
            if (x >= 0 && x < grid.length && y >= 0 && y < grid[0].length && grid[x][y] == '1') {
                dfs(grid, x, y);
            }
        }
    }
}
```
每个节点实际只访问1次，时间复杂度为`O(m*n)`，空间复杂度为`O(m*n)`，最坏情况下整个网格均为陆地，DFS的调用栈深度达到`m*n`。

还可以使用DFS，需要用到队列，不过速度相比之下更慢。
```java
    private void bfs(char[][] grid, int i, int j) {
        Queue<Integer> queue = new LinkedList<>();
        queue.offer(i * grid[0].length + j);
        while (!queue.isEmpty()) {
            int id=queue.poll();
            int row = id / grid[0].length, col = id % grid[0].length;
            grid[row][col]='2';
            for (int[] dir : dirs) {
                int x = row + dir[0], y = col + dir[1];
                if (0 <= x && x < grid.length && 0 <= y && y < grid[0].length && grid[x][y] == '1') {
                    queue.offer(x * grid[0].length + y);
                }
            }
        }
    }
```
我的写法只通过了38/47个测试用例，面对比较大的输入以及'1'比较多的情况就会超时，官方的bfs写法也只击败了21.47%的用户。官方和我的不同就是在入队列之前就已经修改了当前陆地'1'的值，以及没有调用而是直接把BFS写入同一个方法。

## [LeetCode 130. 被围绕的区域](https://leetcode-cn.com/problems/surrounded-regions)
### 题目描述
给定一个二维的矩阵，包含 'X' 和 'O'（字母 O）。

找到所有被 'X' 围绕的区域，并将这些区域里所有的 'O' 用 'X' 填充。

### 示例
```
示例:
X X X X
X O O X
X X O X
X O X X

运行你的函数后，矩阵变为：
X X X X
X X X X
X X X X
X O X X

解释:
被围绕的区间不会存在于边界上，换句话说，任何边界上的 'O' 都不会被填充为 'X'。 
任何不在边界上，或不与边界上的 'O' 相连的 'O' 最终都会被填充为 'X'。
如果两个元素在水平或垂直方向相邻，则称它们是“相连”的。
```

### 解题思路
假如从内部任意一点的'O'开始填充，由于不知道是否会连向边界的'O'，一旦发现连到边界上那么之前的填充都是错误的，所以不能这样修改。可以使用一个同等大小的数组来标记数组中的某个'O'是否是连到边界上的，以边界上所有的'O'为起点进行DFS，把所有连到边界上的'O'标记出来。第二次再遍历矩阵，把所有非边界上的'O'填充为'X'。
```java
public class No130_SurroundedRegions {
    private boolean[][] connectedToBorder;
    private final int[][] dirs={{0,1},{0,-1},{1,0},{-1,0}};
    int m,n;

    public void solve(char[][] board) {
        if (board==null||board.length==0) return;;
        m = board.length;
        n = board[0].length;
        connectedToBorder= new boolean[m][n];

        //以边界上的'O'为起点进行DFS
        for (int i = 0; i < m; i++) {
            if (board[i][0]=='O')
                dfs(board, i, 0);
            if (board[i][n-1]=='O')
                dfs(board, i, n - 1);
        }
        for (int j = 1; j < n - 1; j++) {
            if (board[0][j]=='O')
                dfs(board, 0, j);
            if (board[m-1][j]=='O')
                dfs(board, m - 1, j);
        }
        //根据结果connectedToBorder来确定是否填充
        for (int i = 1; i < m-1; i++) {
            for (int j = 1; j < n-1; j++) {
                if (board[i][j] == 'O' && !connectedToBorder[i][j]) {
                    board[i][j] = 'X';
                }
            }
        }
    }

    private void dfs(char[][] board, int i, int j) {
        connectedToBorder[i][j]=true;
        for (int[] dir : dirs) {
            int x = i + dir[0], y = j + dir[1];
            //如果之前被标记过了就不用再DFS了
            if (0 <= x && x < m && 0 <= y && y < n && !connectedToBorder[x][y] && board[x][y] == 'O') {
                dfs(board, x, y);
            }
        }
    }
}
```
该方法的时间复杂度为`O(m*n)`，因为每个'O'只会被访问和标记1次，填充时数组内层的每个元素只会访问一次；空间复杂度为`O(m*n)`，使用了`m*n`的标记数组，DFS调用栈在最差情况下也是`m*n`层