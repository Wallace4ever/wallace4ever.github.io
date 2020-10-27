---
title: 鸟哥的Linux私房菜学习笔记
date: 2020-10-24
tags:
 - 操作系统
categories:
 - 知海拾贝
---

:::tip
以前我很爱折腾，最早接触Linux是大一那时候在学校的开源社区，入门培训就是从头安装配置Arch Linux，后面到Deepin、Ubuntu、CentOS、Manjaro再到LFS尝试过很多Linux发行版，不过总是用到哪里学到哪里，对Linux没有一个系统的学习与理解过程。《鸟哥的Linux私房菜》这本经典的入门书籍虽然不适合用作大学教材，但强调动手实践很接地气，我们就基于这本书来系统地学习Linux的设计哲学与使用技巧。
:::
<!-- more -->

建议在虚拟机中安装一个CentOS用于实践书中的知识点。我们跳过第一部分预备知识和安装过程，从第二部分开始讲起。

# 第二部分：Linux文件、目录与磁盘格式

## 第6章 Linux的文件权限与目录配置
### Linux文件权限概念
Linux中每个文件都有很多的属性和权限，其中最重要的可能就是文件所有者的概念了。在Linux中，对于一个文件可以分别为其所有者（user）、其所有者同组的用户（group）和其他用户（others）设置文件权限。通过`ls`命令的-l选项可以`以长列表形式`详细查看当前目录下非隐藏文件的详细属性:
```bash
➜  ~ ls -l
total 2200
-rw-r--r--. 1 root root     424 Oct 20 11:12 1.txt
-rw-------. 1 root root    2062 Jun 19 21:41 anaconda-ks.cfg
-rw-r--r--. 1 root root     300 Sep 24 22:11 firewallRedis.txt
-rw-r--r--. 1 root root    2110 Jun 19 21:46 initial-setup-ks.cfg
drwxr-xr-x. 2 root root       6 Jun 19 21:55 perl5
drwxr-xr-x. 2 root root      31 Oct 20 15:45 python
drwxrwxr-x. 9 root root    4096 Aug  9 14:34 redis-6.0.6
-rw-r--r--. 1 root root 2228781 Jul 21 02:32 redis-6.0.6.tar.gz
```
在上面我们能看到每一个文件的权限、连接数、所有者、文件所属的用户组、文件的容量、修改日期和文件名。让我们把重点放在权限部分，该部分由十个字符加一个句号组成。

第一个字符表明了该文件是什么类型的文件，通常我们遇到最多的是【`-`表示普通文件】和【`d`表示文件夹directory】，此外还有【`l`表示符号连接文件symbolic linkfile】、【`b`表示块特殊文件block special file，通常是磁盘等设备】、【`c`表示串行端口设备character special file，如键鼠】以及【`p`表示管道文件pipe】。

后面九个字符每三个一组分别对应所有者、用户组和其他用户的读`r`、写`w`、执行`x`权限，如果没有相应的权限就用`-`代替。对于文件夹而言，其读权限表示能否读取文件夹中的内容，写权限表示能否创建、删除、重命名、移动目录下的文件（**即使没有文件的权限**），执行权限表示能否进入该目录并将其作为工作目录（即不能读取该目录下的文件）。

文件夹权限示例：我们在所有用户都可以工作的/tmp目录下以root用户的身份创建一个文件夹、在文件夹内创建一个普通文件，再切换到普通用户并尝试访问该文件夹：
```bash
# 1.新建的文件夹默认权限为755
➜  /tmp mkdir testdir
# 这时以普通用户的身份是能查看testdir下的文件列表的
[wallace@centos-vm tmp]$ ls -l testdir/
总用量 0
-rw-r--r--. 1 root root 0 10月 27 15:44 testfile

# 2.切换回root用户并修改testdir的权限为744
➜  /tmp chmod 744 testdir
# 这时由于普通用户有r权限可以查询文件夹中的文件名，但没有该文件夹的x权限就没有文件夹下的文件的访问权限
[wallace@centos-vm ~]$ ll /tmp/testdir/
ls: 无法访问/tmp/testdir/testfile: 权限不够
总用量 0
-????????? ? ? ? ?            ? testfile

# 3.切换回root用户并修改testdir的权限为700
➜  /tmp chmod 700 testdir
# 这时由于连r权限都没有了就连查询文件夹中文件的权限都没有了
[wallace@centos-vm ~]$ ll /tmp/testdir/
ls: 无法打开目录/tmp/testdir/: 权限不够
```

:::warning
所以要开放文件夹给他人访问时通常至少要给与r和x权限，但文件夹的写权限w非常重要，一定要谨慎设置。
:::

### 修改文件的权限相关的属性
我们可以分别使用`chown`、`chgrp`和`chmod`修改文件的所有者、所属的用户组和权限。这三个命令可能都需要使用超级权限执行。三个命令的使用方法很相似：
```bash
chgrp 组名 要修改的文件
chown 用户名 要修改的文件
chown 用户名:组名 要修改的文件 # 可以同时或分别修改文件的用户和用户组
chmod 权限 要修改的文件
```
他们都可以加上-R选项来递归地设置属性，例如：
```bash
# 把当前目录下所有的文件及文件夹的子文件的所有者递归地设为root
chown -R root .
# 把python目录下的所有文件及子文件权限设为仅所有者可读可写可执行，其余用户均不可读
chmod -R 700 python
```
在上面chmod使用到的属性参数是三个数字，这三个数字也分别对应着所有者、用户组、其他用户的权限。读权限=4，写权限=2，执行权限=1，则他们的和能够确定对应的用户有着哪些权限。

此外我们也可以使用chmod的符号参数来修改属性，修改时要指明身份、设置方法与设置方法对应的权限。身份包括u(user)/g(group)/o(others/a(all)，设置方法包括+(添加特定权限)/-(移除特定权限)/=(设置全部权限)。示例：
```bash
# 设置所有者可以读写执行，其余用户可以读和执行
chmod u=rwx,go=rx myscript.sh
# 为所有人添加写权限
chmod a+w myscript.sh
# 去除所有人的执行权限
chmod a-x myscript.sh
```

:::tip
复制`cp`和移动`mv`文件会保留文件的权限属性，所以要把文件给别人则在复制或移动完之后还要记得修改相关的属性权限。
:::

### linux权限补充：rwt rwT rws rwS 特殊权限
一个文件都有一个所有者, 表示该文件是谁创建的. 同时, 该文件还有一个组编号, 表示该文件所属的组, 一般为文件所有者所属的组.

如果是一个可执行文件, 那么在执行时, 一般该文件只拥有调用该文件的用户具有的权限. 而setuid, setgid 可以来改变这种设置.

* setuid：该位是让普通用户可以以root用户的角色运行只有root帐号才能运行的程序或命令。
* setgid: 该权限只对目录有效。目录被设置该位后，任何用户在此目录下创建的文件都具有和该目录所属的组相同的组。
* sticky bit: 该位可以理解为防删除位。 一个文件是否可以被某用户删除， 主要取决于该文件所属的目录是否对该用户具有写权限。如果没有写权限，则这个目录下的所有文件都不能被删除，同时也不能添加新的文件。如果希望用户能够添加文件但同时不能删除文件，则可以对文件使用sticky bit位。设置该位后，就算用户对目录具有写权限，也不能删除该文件。

例如，用户账户相关的信息存储在/etc/passwd中，作为普通账户只能查看其中的信息，但普通用户却可以通过执行/usr/bin/passwd来修改自己的密码，实际上间接修改了/etc/passwd这个文件。其关键就在于/usr/bin/passwd的权限设置。
```bash
# 本来普通用户只有读权限
➜  ~ ls -l /etc/passwd
-rw-r--r--. 1 root root 2760 8月  10 10:54 /etc/passwd

➜  ~ ls -l /usr/bin/passwd 
-rwsr-xr-x. 1 root root 27856 4月   1 2020 /usr/bin/passwd
```
由于/usr/bin/passwd 文件已经设置了setuid 权限位（也就是-rwsr-xr-x中的s），所以普通用户能临时变成root，间接的修改/etc/passwd，以达到修改自己口令的权限。

在Linux系统中，/tmp文件夹的权限就比较特殊，为`drwxrwxrwt`。表示其他用户可以读写执行该目录下的文件/文件夹但不能删除。对于该目录下的文件夹如testdir，如果设置了others用户对于其有写权限，则其子文件/夹可以被其他用户删除。一般新建的文件夹权限为755，这样就保证了其他用户一般不能删除别的用户创建的文件和文件夹。

#### 修改以上特殊权限
修改以上这几个特殊的权限也是使用chmod命令，同样地可以使用数字参数或者符号参数来实现修改。

* 数字参数，例如原来我们有777，755，666，644等表示，现在在原有的权限之前扩展一位用于表示setuid，setgid和sticky 位。4表示setuid，2表示setgid，1表示sticky，那么上面的/usr/bin/passwd就可以表示为4755。
* 字符参数，例如chmod u+s temp -- 为temp文件加上setuid标志；chmod g+s tempdir -- 为tempdir目录加上setgid标志；chmod o+t temp -- 为temp文件加上sticky标志。

那么原来的执行标志x到哪里去了呢? 系统是这样规定的, 如果本来在该位上有x, 则这些特殊标志显示为小写字母 (s, s, t). 否则, 显示为大写字母 (S, S, T)。

:::warning
注意：setuid和setgid会面临风险，所以尽可能的少用
:::

### Linux目录配置
通常各Linux发行版的目录配置的方式都遵循所谓的FHS（Filesystem Hierarchy Standard）即文件系统层次结构标准。FHS将Linux目录定义为两个维度共四种交互作用的形态。分别是：不变的（static）与可变的（variable）、可分享的（sharable）与不可分享的（unshareable）。
* 不变的：有些不随着distribution变动的文件，例如函数库、说明文件等。
* 可变动的：经常改变的数据，例如登陆文件、新闻组等。
* 可分享的：可以分享给其他系统挂载使用的目录
* 不可分享的：自己机器上运行的设备文件、socket文件等等，不适合分享给其他主机。

FHS核心定义了根目录、/usr目录、/var三个目录下应该放置什么数据。
1. 根目录/的意义与内容

    所有的目录都是由根目录衍生出来的，下面解释根目录下常用的放置内容。
    ```bash
    # 我们使用tree命令查看根目录结构，-d选项表示仅显示目录，-L后指明显示的目录深度
    ➜  / tree -d -L 1 
    .
    ├── bin -> usr/bin # 放置的是在单用户维护模式下还能够被操作的命令
    ├── boot # 放置开机时会用到的文件，如内核、引导程序等
    ├── dev # 所有设备都以文件的形式存在于此目录当中
    ├── etc # 存放绝大多数系统的主要配置，一般用户可以查询但只有root权限能修改
    ├── home # 存放所有一般用户的主文件夹
    ├── lib -> usr/lib # 存放系统函数库和应用软件函数库，
    ├── lib64 -> usr/lib64
    ├── media # 用于挂载可移除的设备如软盘光盘等
    ├── mnt # 用于临时挂载额外的设备
    ├── opt # optional，可以手动把第三方软件安装到这里
    ├── proc # 虚拟文件系统，存在于内存中，存储内核、进程、设备、网络状态等
    ├── root # 超级用户的主文件夹
    ├── run 
    ├── sbin -> usr/sbin # 存放与开机、修复、还原等命令如fdisk、fsck、ifconfig
    ├── srv
    ├── sys # 虚拟文件系统，记录内核相关的信息，如已加载的内核模块与内核检测到的设备信息
    ├── tmp # 让用户或正在执行的程序暂时存放文件的地方，建议定期清理
    ├── usr
    └── var
    ```

2. /usr目录的意义与内容

    该目录的含义为UNIX Softeware Resource，存放的数据属于可分享的、不可变的。这里存放的不是用户数据而是系统软件资源。类似于Windows下C:\Windows和C:\Program files两个目录的综合体。
    ```bash
    ➜  /usr tree -d -L 1
    .
    ├── bin # 绝大多数用户可使用的命令，以前和/bin的区别在于是否与开机有关，实际上现在/bin链接至/usr/bin
    ├── etc
    ├── games
    ├── include # 存放了用C/C++编写的头文件，这些Linux系统提供的文件为开发者提供了系统调用接口
    ├── lib # /lib链接至此
    ├── lib64 # /lib64链接至此
    ├── libexec
    ├── local # 系统管理员在本机自行安装下载的软件
    ├── sbin # /sbin链接至此
    ├── share # 存放不分硬件架构均可读取的数据（文本文件），如手册、文档等
    ├── src # 源码
    └── tmp -> ../var/tmp
    ```

3. /var目录的意义与内容
    
    该目录主要存放经常性变动的文件，包括缓存、登陆文件和某些软件运行时产生的文件等。

    ```bash
    ➜  /var tree -d -L 1
    .
    ├── account
    ├── adm
    ├── cache
    ├── crash
    ├── db
    ├── empty
    ├── ftp
    ├── games
    ├── gopher
    ├── kerberos
    ├── lib # 程序本身运行时需要用到的资源库
    ├── local
    ├── lock -> ../run/lock # 某些一次只能被一个程序所使用的文件或设备
    ├── log # 日志文件
    ├── mail -> spool/mail
    ├── named
    ├── nis
    ├── opt
    ├── preserve
    ├── run -> ../run
    ├── spool # 存放队列数据
    ├── target
    ├── tmp
    ├── www
    └── yp
    ```