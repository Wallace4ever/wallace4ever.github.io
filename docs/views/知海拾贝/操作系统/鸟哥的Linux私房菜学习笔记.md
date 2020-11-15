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

此外我们也可以使用chmod的符号参数来修改属性，修改时要指明身份、设置方法与设置方法对应的权限。身份包括u(user)/g(group)/o(others)/a(all)，设置方法包括+(添加特定权限)/-(移除特定权限)/=(设置全部权限)。示例：
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

### 文件默认权限与隐藏属性

**umask**

使用umask [-S]可以查看或修改，它指的是创建文件或目录时u/g/o要拿掉的权限，文件的默认权限是666，目录的默认权限是777。root用户的umask为022，表示对于user不拿掉任何权限，对于group和others拿掉写权限。一般身份用户的umask通常为002，即保留用户组的写入权力。

**chattr**和**lsattr**

某些文件系统（如ext2、ext3、ext4）还支持文件的隐藏属性，可以通过chattr和lsattr来修改和查看。lsattr像ls一样也具有-d、-R、-a选项。chattr的用法为`chattr [+-=][ASacdistu] fileOrDir`，重要的权限有：
* a，append-only，设置该属性后文件只能增加数据不能删除也不能修改数据，例如日志文件
* i，设置后让一个文件不能被删除、改名、设置连接、写入或添加数据。

只有root用户才能设置这两个属性。


### linux权限补充：rwt rwT rws rwS 特殊权限
一个文件都有一个所有者, 表示该文件是谁创建的. 同时, 该文件还有一个组编号, 表示该文件所属的组, 一般为文件所有者所属的组.

如果是一个可执行文件, 那么在执行时, 一般该文件只拥有调用该文件的用户具有的权限. 而setuid, setgid 可以来改变这种设置.

* setuid（仅对二进制可执行文件有效）：该位是让普通用户可以以root用户的角色运行只有root帐号才能运行的程序或命令。
* setgid（对二进制程序和目录有效）: 目录被设置该位后，任何用户在此目录下创建的文件都具有和该目录所属的组相同的组。
* sticky bit（仅对目录有效）: 该位可以理解为防删除位。 一个文件是否可以被某用户删除， 主要取决于该文件所属的目录是否对该用户具有写权限。如果没有写权限，则这个目录下的所有文件都不能被删除，同时也不能添加新的文件。如果希望用户能够添加文件但同时不能删除文件，则可以对文件使用sticky bit位。设置该位后，就算用户对目录具有写权限，也不能删除该文件。

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

## 第7章 Linux文件与目录管理

### 目录与路径
平时我们会使用到绝对路径与相对路径。这方面其实没有太多可说的，以根目录`/`开头的就是绝对路径，其余的都是相对路径，其中有几个特殊的目录：
* `.`代表当前目录
* `..`代表上层目录，根目录的上层目录是它自身
* `-`代表上一次的工作目录，`cd -`类似于TV遥控器上的返回键
* `~`代表当前用户的主文件夹
* `~user`代表指定用户user的主文件夹

常见的与目录有关的命令有：
* pwd：print name of working directory 打印当前工作目录 -P选项显示链接文件实际指向的目录
* mkdir：make directories 创建目录，使用-p（--parents）选项可以直接创建多层目录例如`mkdir -p level1/level2/level3`，使用-m（--mode=XXX）选项可以在创建时就指定文件夹的权限，如果同时使用这两个选项那么只有最深层的目录会设为指定的权限。
* rmdir：删除空目录，同样地使用-p选项可以删除上层的空目录。例如`rmdir -p /root/testdir/level1/level2`会从level2开始向上将空目录依次删除直到不能删除为止。

$PATH：是命令执行的搜索范围，普通用户的$PATH内容可能不包含/sbin这样的目录，但可以用过绝对路径执行下面的命令。使用`echo $PATH`来查看当前的路径，使用`PATH="$PATH":/dir`来临时把/dir加入到PATH中。为安全起见不建议把`.`加入到PATH中。

### 文件与目录管理
一、ls（list directory contents）命令应该是最常用的目录管理命令了，其常用的选项有：
* -a，显示包括`.`和`..`在内的所有隐藏、非隐藏的文件和目录
* -A，显示所有隐藏、非隐藏的文件和目录
* -d，仅列出目录本身，而不是目录下的文件
* -f，单纯列出结果，不进行排序，会覆盖掉其它选项
* -F，加上identi`F`ier，用于醒目显示文件类型
* -h，将文件容量用human-friendly的方式显示
* -l，列表显示长数据串
* -r，排序结果反向输出（默认根据文件名排序）
* -S，按照文件的size进行排序
* -t，按照时间排序
* -R，递归列出子目录中的内容
* --full-time，显示详细时间
* -time={atime,ctime}，显示access time / 权限属性的change time，而非内容修改的时间modification time

二、cp命令除了单纯地复制文件，还可以创建连接文件，对比两个文件地新旧再予以更新，复制整个目录。cp可以用于复制单个文件或目录：`cp [-r] source dest`那么这时dest可以是目录或者新文件的绝对名称；也可以用于同时复制多个文件到某个目录下：`cp source1 source2 ... dest`那么dest只能是目标目录。

其常用的选项有：
* -i，--interactive，若文件已经存在，则交互式询问是否覆盖
* -n，默认不覆盖已经存在的文件
* -r，-R，--recursive，递归复制
* -p，preserve，复制时连同属性一起复制，用于存档
* -d，复制时仅复制连接文件，而不是文件本身
* -s，复制成一个symbolic link，软连接文件
* -l，复制成一个硬连接hard link
* -a，--archive，等同于-pdr，存档拷贝
* -u，--update，仅当目标文件比源文件更新才复制

如果不使用-p或-a选项的话，复制的文件相当于新建的相同内容的文件，但属性权限和调用cp的用户有关。权限低的普通用户即使使用-a选项也不能完整复制权限更高的用户组的权限。

三、rm命令，由于rmdir只能用于删除空目录或递归删除多个空目录，可以使用rm来实现递归删除。选项有：
* -r， 递归删除
* -f，强制删除，忽略不存在的文件
* -i，互动模式询问删除

四、其它：
* mv命令，会保持权限属性移动文件，可用于单个文件的快速重命名。
* rename命令，可以使用正则表达式批量重命名文件
* basename/dirname filePath，分别可以获得文件名和目录名

### 文件内容查阅
先简单介绍一下常用的查阅文件内容的命令：
* cat：concatenate，从第一行开始完整显示文件的内容
* tac：从最后一行开始倒序按行显示文件的全部内容
* nl：number lines of files，显示的时候顺便输出行号
* more：按屏幕大小一页一页地显示内容
* less：与more相似，但可以向前翻页
* head：只看头几行
* tail：只看结尾几行
* od：octal dump files，以八（二）进制方式读取文件内容

一、cat命令的选项有
* -n，--number，输出时为每一行都加上行号
* -b，--number-nonblank，输出时仅在非空行前加行号
* -v，显示非打印字符
* -E，--show-ends，将结尾的换行符用`$`显示
* -T，--show-tabs，将Tab显示为`^I`
* -A，--show-all，等价于-vET

二、more命令。由于cat、tac和nl都是一口气将文件的所有内容输出到屏幕上，在内容很多时我们更希望可以一页一页地手动翻页查看。通过more查看文件内容时，可以进行以下交互式操作：
* 空格键，向下翻动一页
* 回车键，向下翻动一行
* /pattern，向下搜索对应的模式
* :f，立即显示文件名和当前行数
* b，往回翻页

三、更强大的less命令。使用more时我们没法逐行逐页向前翻，只能按b回到开头。而less中，我们可以：
* 空格键，向下翻动一页
* PAGEDOWN/下箭头，向下翻动一页/一行
* PAGEUP/上箭头，向上翻动一页/一行
* /pattern，向下查询对应的模式
* ?pattern，向上查询对应的模式
* n，重复前一次查询
* N，反向重复前一次查询

我们发现这和man page中的操作是一致的，实际上man就是调用了less来显示文件内容的。

四、head与tail命令。只显示文件的前面或后面若干行，默认显示10行。示例：
```bash
# head -n [number] filename，显示文件开头指定行数的内容
# tail -n [number] filename，显示文件结尾指定行数的内容

# 显示文件倒数100行之前的内容
head -n -100 file
# 显示文件正数100行之后的内容
tail -n +100 file

# 持续检测文件末尾的内容（例如日志文件），按下Ctrl+C后才停止
tail -f logfile

# 显示文件第11行到第20行的内容（先取前20行再取结果的后10行）
head -n 20 file | tail -n 10
```

五、使用od查阅非纯文本文件。这个命令可能用得不多，可以使用-t [a|c|d|f|o|x]来控制输出的格式。

六、使用touch来创建空文件、修改文件的mtime与atime。
* -a，修改access time
* -m，修改modification time
* -c，不创建新文件，仅修改已有文件的时间
* -d timestring，后接想要修改的日期，不使用-d则使用当前日期
* -t timestamp，使用自定的时间戳

七、使用`file`查看文件的类型

### 命令与文件位置的查询
通过`which`可以在$PATH中查找可执行命令的位置，-a选项可以找出所有吻合的而非最先找到的。

Linux下有很多优异的文件查找命令，whereis和locate是利用数据库来查找数据建议优先使用，find是暴力查找全盘，功能很强大。
* whereis [-bmsu] 文件名或目录名
    * -b，只寻找二进制文件
    * -m，只寻找手册
    * -s，只寻找源代码
    * -u，查找特殊文件
* locate [-ir] keyword，找到所有文件路径中包含keyword的文件
    * -i，忽略大小写
    * -r，使用正则表达式
    * 使用updatedb来按照/etc/updatedb.conf的配置来手动更新mlocate数据库
* find [PATH] [option] [action]可以在指定路径下（不指定则为当前pwd目录）按照选项进行查找。
    * 与时间相关的选项，mtime/ctime/atime，以mtime为例：
        * find /var -mtime -4，在/var下查找小于等于4天内改动过的文件
        * find /var -mtime 4，在/var下查找距今第4~第5天内改动过的文件
        * find /var -mtime +4，在/var下查找距今大于等于5天前改动过的文件
    * 与用户或用户组有关的选项
        * find /home -user wallace，-uid [uidOfWallace]，在/home目录下寻找所有属于Wallace的文件
        * find /tmp -group root，-gid [gidOfRoot]，在/tmp目录下寻找所有属于root用户组的文件
        * 还有-nouser、-nogroup两个选项用于查找所属者或所属组在/etc/passwd和/etc/group中没有记录的文件
    * 与文件权限和文件名有关的选项
        * -name FILENAME，查找指定文件名的文件，名称支持通配符如`find -name '*redis*'`查找当前目录下所有名称包含redis的文件
        * -size [+-] SIZE，查找比SIZE大/小的文件
        * -type TYPE，查找指定TYPE的文件，TYPE可以是一般文件f，设备文件b/c，目录d等等
        * -perm MODE，查找恰好等于指定权限的文件（permission）
        * -perm -MODE，查找包括了指定权限（权限可以更大）的文件
        * -perm +MODE，查找包含指定权限中任一权限的文件
    * 找到的结果默认是-print打印到屏幕，还可以通过指定`-exec`参数来接其他命令来处理查找到的结果。如`find -name '*redis*' -exec ls -l {} \;`，其中`{}`代表找到的内容，从`-exec`到`\;`转义封号之间的内容就是额外的命令。

例题：
```bash
#1. 用find找出目前Linux系统中具有SUID的文件有哪些：
find / -perm -4000 -exec ls -lh {} \;
#2. 找出/etc下文件大小介于50KB到60KB之间的文件，并将权限完整地列出：
find /etc -size +50k -size -60k -exec ls -lh {} \; # 这里有两个条件，默认使用AND逻辑
find /etc \( -size +50k -and -size -60k \) -exec ls -lh {} \; # -and可以简写为-a
#3. 找出/etc下文件大小大于50KB且所有者不是root的文件并完整列出
find /etc -size +50k -uid +0 -exec ls -lh {} \; #通过uid>0来判断用户
find /etc -size +50k ! -user root -exec ls -lh {} \; #通过！非运算来判断
#4. 找出/etc下容量大于1500KB或容量等于0的文件
find /etc \( -size 1500k -o -size 0k \) # -o就是-or
```

## 第8章 Linux磁盘与文件系统管理
### EXT文件系统
一、认识EXTFS：

在Linux中，文件数据除了文件的实际内容之外，还含有非常多的属性。文件系统通常会将这两部分数据放在磁盘的不同的块中：将权限与属性放置到inode中，将实际数据放置到data block中。此外还有一个超级块(superblock)会记录整个文件同的整体信息，包括inode与block的总量、使用量、余量等。

Linux的EXT文件系统中每个文件有一个inode，可能有多个data block，data block的位置就存储在inode中，这种形式称为索引式文件系统，像FAT格式的文件系统并没有inode，每个文件的block的号码都记录在前一个block中，当文件写入的block分散地太厉害时，传统机械式磁盘就需要多转好几圈才能完整读取一个文件，所以才需要碎片整理。

文件系统在一开始时就将inode与block规划好了，除非重新格式化或者使用resize2fs等命令重新更改文件系统大小。所以将所有的inode与block放置在一起会使得inode与block数量太大时不容易管理，因此ext2文件系统在格式化时会区分多个块组（block group），每个块组都有独立的inode/block/superblock系统，具体来说分为superblock、文件系统描述（group descriptor）、块对应表（block bitmap，记录使用与未使用的block）、inode bitmap（记录使用与未使用的inode）、inode table、data block。

二、ETXFS与目录的关系：

我们在EXT文件系统中新建一个目录时，会分配一个inode与至少一块block给该目录。inode记录了该目录相关权限属性与分配到哪块block号码，而block则是记录这个目录下的文件名与该文件名占用的inode号码数据。

由于目录树是从根目录开始读起，因此系统通过挂载的信息可以找到挂载点的inode号码，此时就能够得到根目录的inode内容并依据inode读取根目录的block内记录的文件名数据，进而一层层读取到正确的子目录、文件。

每个文件系统都有独立的inode、block、superblock等信息，文件系统只有链接到目录树才能被我们使用，该过程成为挂载。挂载点一定是目录，该目录为进入该文件系统的入口。

三、日志文件系统（journaling file system）：

由于写入inode table与data block这两个数据存放区域后还要更新superblock、inode bitmap、block bitmap等元数据，一旦出现故障就会发生数据不一致的问题。因此日志文件系统诞生了，其思想是在文件系统中规划出一个块，专门用于记录写入或修订文件时的步骤：
* 预备：在要写入一个文件时，现在日志记录块中记录该文件准备要写入。
* 实际写入：写入文件的权限与数据并更新metadata。
* 结束：在日志块中完成该文件的记录。

EXT文件系统从EXT3开始就支持日志文件系统。

### 文件系统的简单操作

一、df [-option] [目录或文件名]，(disk space available on the file system)列出文件系统的整体磁盘使用量。常用的选项有：
* -a，列出所有文件系统，包括/proc等
* -k/-m，以KB/MB为单位显示，默认为KB
* -h，以human-readable的方式自行显示
* -T，连同分区的文件系统类型一起显示
* -i，不用硬盘容量而是以inode的数量来显示

```bash
# 范例
➜  ~ df -hT
Filesystem              Type      Size  Used Avail Use% Mounted on
devtmpfs                devtmpfs  903M     0  903M   0% /dev
tmpfs                   tmpfs     919M     0  919M   0% /dev/shm
tmpfs                   tmpfs     919M  9.5M  910M   2% /run
tmpfs                   tmpfs     919M     0  919M   0% /sys/fs/cgroup
/dev/mapper/centos-root xfs        47G  7.2G   40G  16% /
/dev/sda1               xfs      1014M  186M  829M  19% /boot
tmpfs                   tmpfs     184M   40K  184M   1% /run/user/1000
```

二、du [-option] [文件或目录名]，(estimate file space usage)。df主要读取的是superblock的信息，而du会直接到文件系统中查找所有文件数据。常用的选项有：
* -a，列出所有文件与目录容量，默认仅显示目录下的文件量
* -h，human-readable
* -s，只列出目录的总容量
* -S，统计时不算入子目录的大小
* -k/-m，同上

```bash
# 范例，检查根目录下每个目录所占用的容量
➜  ~ du -sm /*
0	/bin
153	/boot
0	/dev
47	/etc
96	/home
0	/lib
0	/lib64
0	/media
0	/mnt
218	/opt
du: cannot access '/proc/20992/task/20992/fd/3': No such file or directory
du: cannot access '/proc/20992/task/20992/fdinfo/3': No such file or directory
du: cannot access '/proc/20992/fd/3': No such file or directory
du: cannot access '/proc/20992/fdinfo/3': No such file or directory
0	/proc
155	/root
du: cannot access '/run/user/1000/gvfs': Permission denied
10	/run
0	/sbin
0	/srv
0	/sys
1	/tmp
6048	/usr
603	/var
```

三、连接文件ln

Linux下的连接文件有两种，一种是类似Windows快捷方式功能的文件，可以让你快速连接到目标文件或目录，这种称为软连接（symbolic link）；另一种则是通过文件系统的inode连接来产生新的文件名，而不是产生新文件，这种称为硬链接（hard link）。

* 硬连接（又称实际连接）
    * 由于想要读取某个文件必须经过目录记录的文件名来指向该文件的inode号码，所以其实文件名只与目录有关。硬连接其实就是在某个目录下新建一条文件名连接到某文件的inode号码而已。
    * 如果有多个硬连接连接到同一个文件的inode，那么可以将多个“文件名”删除，而文件的inode和block都是存在的，可以通过剩余的“文件名”来读取数据。使用硬连接设置连接文件时，仅仅是在若干目录的block中多写入一个关联数据而已，不会增加inode和block的数量（目录的block刚好满的情况除外）。
    * 硬连接不能跨文件系统，不能连接到目录（因为要连接目录下所有文件而不仅是目录本身，开销大不易管理）
    ```bash
    # 在当前目录下建立目标文件的硬连接
    ➜  ~ ln /etc/crontab . 
    # 比较两个目录下文件的信息，发现两个不同的文件名指向同一个inode
    ➜  ~ ll -i /etc/crontab ./crontab         
    34934914 -rw-r--r--. 2 root root 451 Jun 10  2014 ./crontab
    34934914 -rw-r--r--. 2 root root 451 Jun 10  2014 /etc/crontab
    ```
* 软连接（快捷方式）
    * 本质就是再创建一个独立的文件，会让数据的读取指向它连接的文件的文件名。
    * 当源文件被删除后，通过软连接就无法打开指向的文件了。
    * 软连接可以跨文件系统，可以连接目录
    ```bash
    # 删除前面创建的硬连接后原文件的连接数变为1
    ➜  ~ rm crontab   
    ➜  ~ ll -i /etc/crontab          
    34934914 -rw-r--r--. 1 root root 451 Jun 10  2014 /etc/crontab
    # 创建新的软连接
    ➜  ~ ln -s /etc/crontab ./crontab2
    # 注意原文件前的连接数仍为1
    ➜  ~ ll -i /etc/crontab ./crontab2 
    67507563 lrwxrwxrwx. 1 root root  12 Nov  1 19:47 ./crontab2 -> /etc/crontab
    34934914 -rw-r--r--. 1 root root 451 Jun 10  2014 /etc/crontab
    ```

:::tip
关于目录的连接数：

在新建一个目录dir时，会产生三个文件名：`/parentdir/dir`、`/parentdir/dir/.`和`/parentdir/dir/..`，其中前两个文件名指向的就是该目录的inode，后一个文件名指向的是其父目录的inode。所以新建一个目录时，新目录的连接数为2，而上层目录的连接数会加1。
```bash
➜  ~ ll -d /tmp                                              
drwxrwxrwt. 18 root root 4.0K Nov  1 20:05 /tmp
➜  ~ mkdir /tmp/testdir
➜  ~ ll -d /tmp        
drwxrwxrwt. 19 root root 4.0K Nov  1 20:22 /tmp
➜  ~ ll -d /tmp/testdir 
drwxr-xr-x. 2 root root 6 Nov  1 20:22 /tmp/testdir
```
:::

### 磁盘的分区、格式化检验与挂载
一、fdisk是一个功能强大的系统管理工具，可以用于删除、创建、格式化磁盘的分区。输入`fdisk -l`可以查看磁盘列表。直接执行`fdisk [设备文件名]`后我们进入到一个交互式界面，输入m并回车可以显示全部menu，包括了：
```
Command action
a   toggle a bootable flag
b   edit bsd disklabel
c   toggle the dos compatibility flag
d   delete a partition                      # 删除一个分区
g   create a new empty GPT partition table
G   create an IRIX (SGI) partition table
l   list known partition types
m   print this menu
n   add a new partition                     # 新增一个分区
o   create a new empty DOS partition table
p   print the partition table               # 在屏幕上打印分区表
q   quit without saving changes             # 不保存在程序内做的改动直接退出
s   create a new empty Sun disklabel
t   change a partition's system id
u   change display/entry units
v   verify the partition table
w   write table to disk and exit            # 将改动写入到硬盘后再退出程序
x   extra functionality (experts only)
```
新建分区时会让我们选择分区类型、分区编号、起始sector、结束sector（可以直接指定大小，如+16G）。删除分区时只需要指定分区号。另外书中记载fdisk没办法处理大于2TB的磁盘分区，时至今日我手头没有这么大的硬盘，所以也没法验证现在是否改进了支持，可以使用parted命令来处理。

传统MBR分区硬盘主分区+扩展分区的数量最多只支持到4个，扩展分区进一步划分为逻辑分区时，SATA硬盘最多分到15号分区，IDE硬盘最多分到63号。GPT分区硬盘则可以有很多主分区，当然个人使用时通常不会分到这么多分区。我们在使用d和n删除、新建分区并w保存新的分区表后就需要对各新分区进行格式化。

二、使用mkfs（make file system）对新分区进行格式化。该命令其实是一个综合命令，下面在使用`mkfs -t ext4 ...`时实际上调用的是mkfs.ext4/mke2fs这个命令来进行格式化。
```bash
# 这里由于我们没有指定详细的参数，使用的都是默认值
➜  ~ mkfs -t ext4 /dev/sdb1
mke2fs 1.42.9 (28-Dec-2013)
Filesystem label=
OS type: Linux
Block size=4096 (log=2)
Fragment size=4096 (log=2)
Stride=0 blocks, Stripe width=0 blocks
262144 inodes, 1048576 blocks
52428 blocks (5.00%) reserved for the super user
First data block=0
Maximum filesystem blocks=1073741824
32 block groups
32768 blocks per group, 32768 fragments per group
8192 inodes per group
Superblock backups stored on blocks: 
	32768, 98304, 163840, 229376, 294912, 819200, 884736

Allocating group tables: done                            
Writing inode tables: done                            
Creating journal (32768 blocks): done
Writing superblocks and filesystem accounting information: done 
```
mke2fs是一个有着很复杂选项与参数的命令，如果不是高级管理员的话没有特殊需求一般用得不多，了解即可。

三、使用fsck（file system check）来检查文件系统的错乱，常用的选项有：
* -t，指定文件系统，来综合确定要调用的命令，目前通常可以自动确定FS类型因而一般不需要该选项
* -A，依据/etc/fstab的内容将需要的设备扫描一次
* -a/-y，自动修复检查到有问题的扇区
* -C，使用进度条显示检验进度
* -f，ext2/3支持强制检查
* -D，优化ext2/3中的目录

注意，执行fsck时，目标分区不能挂载到系统上。仅在文件系统出问题时root才使用此命令，正常情况使用此命令可能对系统造成危害。

四、使用mount/unmount命令挂载/卸载磁盘

我们在挂载磁盘到目录树时首先要确定几件事
* 单一文件系统不应该被重复挂载在不同的挂载点中
* 单一目录不应重复挂载多个文件系统
* 作为挂载点的目录理论上应该是空目录（非空目录挂载新FS时原来的文件会被暂时隐藏）

直接输入mount会显示目前挂载的信息，mount命令的常用选项有：
* -a，依照/etc/fstab的配置将所有未挂载的磁盘都挂载上来
* -t，指定文件系统类型，系统会分析superblock搭配已有的驱动程序去测试挂载，所以一般不需要该选项
* -L，使用卷标Label来定位磁盘并挂载，默认使用的是设备文件名挂载（/dev/sda1）
* -o，后接文件系统挂载选项(mount options)，例如ro/rw挂载为只读/读写，remount重新挂载
* -n，不写入/etc/mtab直接挂载
* --bind，将某个目录挂载到另一个目录，本质是指向同一个inode。使用场景是适配不支持软连接的软件

-o选项参数比较多，通常我们不用-o选项而是直接使用默认配置挂载磁盘，过程如下。
```bash
# 将刚才格式化后的/dev/sdb1挂载
➜  ~ mkdir /mnt/sdb1       
➜  ~ mount /dev/sdb1 /mnt/sdb1 
➜  ~ df -h 
Filesystem               Size  Used Avail Use% Mounted on
devtmpfs                 903M     0  903M   0% /dev
tmpfs                    919M     0  919M   0% /dev/shm
tmpfs                    919M  9.5M  910M   2% /run
tmpfs                    919M     0  919M   0% /sys/fs/cgroup
/dev/mapper/centos-root   47G  7.2G   40G  16% /
/dev/sda1               1014M  186M  829M  19% /boot
tmpfs                    184M   28K  184M   1% /run/user/1000
/dev/sdb1                3.9G   16M  3.6G   1% /mnt/sdb1 # 看到了挂载的磁盘分区

# 将根目录/重新挂载
➜  ~ mount -o remount,rw,auto /
```

umount [-option] 设备文件名或挂载点，可以卸载磁盘，选项有-f强制卸载（例如网络文件系统无法读取）、-n不更新/etc/mtab的情况下卸载。

其他较少使用的修改磁盘参数的命令：mknod创建block或character类型的特殊设备文件、e2label设置磁盘分区卷标、tune2fs调整ext文件系统。

### 设置开机挂载、虚拟光驱
Linux系统挂载的一些限制：
* 根目录/是必须挂载的，并且是先于其他挂载点被挂载的
* 其他挂载点必须为已新建的目录，可以任意指定，但需要遵守FHS的原则
* 需要遵守前面提到的几点原则，不要在同一时间内重复挂载同一分区和同一挂载点
* 卸载时工作目录不能在挂载点及子目录

一、开机自动挂载的配置文件是/etc/fstab，其格式内容如下：
```bash
#
# /etc/fstab
# Created by anaconda on Fri Jun 19 21:19:42 2020
#
# Accessible filesystems, by reference, are maintained under '/dev/disk'
# See man pages fstab(5), findfs(8), mount(8) and/or blkid(8) for more info
#设备文件名或Label                           #挂载点  #文件系统    #-o参数     #是否做dump备份  #是否进行fsck
/dev/mapper/centos-root                     /       xfs         defaults    0               0
UUID=fc04847f-3586-409f-9f10-0167066aa5ce   /boot   xfs         defaults    0               0
/dev/mapper/centos-swap                     swap    swap        defaults    0               0
```
我们只需要按照格式写入需要自动挂载的磁盘分区信息即可，实际上文件系统的挂载是记录到/etc/mtab和/proc/mounts这两个文件中的。一旦fstab中的数据有误导致无法开机而进入单用户维护模式，根目录是只读的状态，这时就需要通过`mount -n -o remount,rw /`来重新挂载根目录，这样就可以进一步修改fstab了。

二、特殊设备loop挂载（就是虚拟光驱）
loop选项能够在不刻录镜像文件的情况下读取数据。
```bash
➜  ~ mkdir /mnt/centos_dvd
➜  ~ mount -o loop /root/centos_dvd.iso /mnt/centos_dvd # -o后接loop选项
```
在某些场景下我们使用虚拟机可以用dd命令创建一个大文件，然后挂载为loop device，就可以在不改变宿主机分区的前提下作为虚拟机的分区（不过虚拟机一般有自己专用的磁盘文件格式吧比如VHD）。使用dd命令创建的大文件也可用作swap（了解，swap在目前硬件条件提高的情况下存在意义已经不大）。

## 第9章 文件与文件系统的压缩与打包
虽然对于Linux来说扩展名没有什么作用，不过为了便于方便人记忆，Linux下不同压缩程序产生的压缩文件都对应不同的扩展名：
* .Z，compress程序压缩的文件（很少使用）
* .gz，gzip程序压缩的文件
* .bz2，bzip2程序压缩的文件
* .tar，tar程序打包的数据，并没有压缩过
* .tar.gz，tar程序打包的数据，经过gzip的压缩
* .tar.bz2，tar程序打包的数据，经过bzip2的压缩

### Linux常见压缩命令
一、gzip压缩，用法为`gzip [-cdtv#] 文件名`，常用选项有：
* -c，--stdout，将压缩的数据输出到屏幕上，可通过数据流重定向来处理
* -d，--decompress，解压缩的参数
* -t，--test，检验压缩文件的一致性是否有误
* -v，--verbose，可以显示文件的压缩比等信息
* -#，--fast/-1，--best/-9，#代表等级，默认等级为6

默认压缩时可以不用加任何选项，这样压缩后的文件会替换掉源文件，可以使用-c将压缩后的数据输出到标准输出流（`➜  /tmp gzip -c file`会直接输出到屏幕，乱码），可以重定向到指定的文件中（`➜  /tmp gzip -c file > file.gz`会将压缩后的编码输出到新建的文件）这时就会保留源文件。

使用zcat可以直接查看经由gzip和compress压缩后的纯文本文件。

二、bzip2压缩，其用法和gzip几乎相同，同样具有-c/-d/-t/-v/-#的选项，此外还有-k（--keep）保留源文件，-z强制压缩等选项。bzip2能提供比gzip更优的压缩比。压缩后的文本文件可以用bzcat来直接读取。

### 打包命令tar
虽然gzip和bzip2都可以针对目录进行压缩，不过指的是将目录内的所有文件分别进行压缩。想要整体压缩则需要使用tar来打包，同时tar也可以通过gzip/bzip2的支持将打包后的文件同时压缩。

tar的选项参数非常多，常用的参数有：
* -c，--create，新建打包文件，可通过-v来查看过程中被打包的文件名
* -t，--list，查看打包文件的内容含有哪些文件名
* -x，--extract，解打包或者解压缩。（-c-t-x不可以在一条命令中同时使用）
* -C，--directory=dir，指定目标目录
* -j，--bzip2，通过bzip2进行压缩/解压缩，文件名最好为*.tar.bz2
* -z，--gzip，通过gzip进行压缩/解压缩，文件名最好为*.tar.gz
* -v，--verbose，啰嗦模式，在过程中显示信息
* -f，--file=FILE，指定要被处理的文件名
* -p，--preserve-permissions，保留数据原本的权限与属性
* -P，文件名保留绝对路径（这样的话解压后文件就会被放回到原来的位置）
* --exclude=FILE，排除某文件

简单来说，tar的使用场景主要是三种：
1. 打包与压缩：`tar [-z|-j] [-cv] [-f 压缩文件名] 源文件/目录`
2. 查看压缩包中的文件名列表：`tar [-z|-j] [-tv] [-f 压缩文件名]`
3. 解压缩：`tar [-z|-j] [-xv] [-f 压缩文件名] [-C 要解压到的目录]`

```bash
# 示例：使用tar和bzip2备份/etc目录
➜  /tmp tar -jcvp -f /root/etc.tar.bz2 /etc
tar: Removing leading `/' from member names
/etc/
/etc/fstab
```
在上面的示例中，提示文件名中移除了根目录（即变成了相对路径），如果加入-P选项在文件名中保留根目录则解压时一定会按照原有的路径放置，有可能覆盖掉文件。所以一定要确定自己备份的需求再确定选项。

仅仅提取压缩包中指定的文件：
```bash
# 1. 首先使用-t选项配合grep找到想要的文件名
➜  /tmp tar -jtv -f ~/etc.tar.bz2 | grep 'shadow'
-rw-r--r-- root/root       214 2020-08-07 01:26 etc/pam.d/sssd-shadowutils
---------- root/root       883 2020-08-14 10:23 etc/gshadow
---------- root/root      1420 2020-08-10 10:54 etc/shadow # 找到目标文件记录在压缩包中的文件名
---------- root/root       875 2020-06-19 21:50 etc/gshadow-
---------- root/root      1420 2020-08-10 10:54 etc/shadow-
# 2. 指定解压压缩包中的目标文件到当前目录
➜  /tmp tar -jxv -f ~/etc.tar.bz2 etc/shadow   # 这里我试了使用-C指定目录好像还是解压到当前目录
```
tar可以同时打包压缩多个目录并且排除特定文件，还可以利用管道命令和数据流，这些到bash部分再详细介绍。

### 完整备份工具dump
（我在CentOS7下未能找到该命令所以没法验证，应该不是dumpe2fs吧）dump除了能够针对整个文件系统进行备份，也可以仅仅针对目录进行备份。其格式为`dump [-Suvj] [-level] [-f 备份文件] 待备份数据`，进行一些简单的备份操作常用的选项有：
* -S，仅列出后面待备份的数据需要多少磁盘空间才能备份完毕
* -u，将这次dump时间记录到/etc/dumpdates中
* -v，啰嗦模式
* -j，加入bzip2的支持，对数据进行压缩
* -level，指定dump等级
* -f，指定dump文件名
* -W，列出在/etc/fstab里面具有dump设置的分区是否有备份过

dump的恢复使用restore命令（同样地，我在CentOS7下没有找到该命令）就不详细介绍了。

### 其他
使用mkisofs可以将数据打包进.iso文件，再使用cdrecord可以进行光盘刻录（现在光盘已经要被淘汰了吧）。

dd：convert and copy a file。格式为`dd if=INPUTFILE of=OUTPUTFILE bs=BLOCKSIZE count=NUMBER`，分别指明输入输出文件（可以是设备），block的大小不指名的话默认为512bytes。如果仅仅是指明文件的话看起来好像和cp命令没什么不同，但是通过指定设备文件可以实现扇区或者磁盘备份到文件，恢复的话交换if和of就可以了。由disk到disk甚至不需要经过格式化。

cpio：copy files to and from archives。可以备份任何东西包括设备文件，不过需要结合find等能找到文件名的命令来确定要备份的数据在哪里。

# 第三部分 学习shell与shell script
## 第10章 vim程序编辑器
大名鼎鼎的vim编辑器是所有UNIX Like系统都会内置的文本编辑器，学习曲线前期陡峭但学好了编辑速度能大大提升。

vi分为三种模式：一般模式、编辑模式和命令行模式，作用分别如下：
* 一般模式：打开文件就进入一般模式了，在该模式中可以用方向键来移动光标，可以删除字符或整行，可以复制粘贴文件数据。
* 编辑模式：在一般模式下输入`i/I/o/O/a/A/r/R`中任意一个字母后才会进入编辑模式，进入编辑模式后按ESC键就可以退回到一般模式。
* 命令行模式：在一般模式中输入`:`、`/`和`?`三个字符中的任意一个就会进入命令行模式，在该模式下可以提供查找、大量替换字符等额外功能。

### 一般模式下的常用按键说明
****
移动与定位
* 移动光标：使用方向键或者编辑键区的hjkl（对应←↓↑→）可以实现移动光标，想要快速移动多行的话可以用数字+方向来实现，例如要向下移动30行，可以在一般模式下输入`30j`或者`30↓`。
    * 还可以通过数字+空格实现向右移动光标，数字+Enter实现向下移动光标（不过光标会到行首）
* PageDown / Ctrl + f，forward向前翻动一页。
* PageUp / Ctrl + b，backward向后翻动一页。
* Home / 0，移动到行首
* End / $，移动到行尾
* H / M / L，移动到当前屏幕最上方/中间/下方那一行的行首
* G，移动到文件的最后一行
* nG，n为数字，移动到第n行
* gg，移动到文件的第一行，相当于1G
****
查找与替换
* /word，向下查找名为word的字符串
* ?word，向上查找名为word的字符串
* n/N，正向/反向重复上一次查找操作。这部分与less很相似。
* :num1,num2s/word1/word2/g，在num1行和num2行之间（包括num1和num2）寻找word1并替换为word2。num一般是数字，也可以是`$`表示最后一行如`:1,$s/line/pine/gc`表示从第一行到最后一行搜索line替换为pine并让用户confirm。
****
删除复制与粘贴
* x/X，x相当于del向后删除，X向前删除。（backspace不能直接向前删除了，只是移动光标）
* nx/X，向后或向前删除n个字符
* dd，删除光标在的一整行
* ndd，向下删除包括当前行在内的n行
* d1G，删除光标所在行到第一行的所有行
* dG，删除光标所在行到最后一行的所有行
* d$，删除光标所在处到行末的所有字符
* d0，删除光标所在处到行首的所有字符
* yy，复制光标所在的行（yank）
* nyy，复制光标所在的向下n行
* y1G，复制光标所在行到第一行的数据
* yG，复制光标所在行到最后一行的所有数据
* y0，复制光标所在处到行首的所有数据
* y$，复制光标所在处到行末的所有数据
* p/P，p将已复制的数据粘贴在光标下一行，P将数据粘贴在上一行
* J，将光标所在行与下一行合并成一行
* u，复原前一个操作undo
* Ctrl + r，重做撤销的操作redo
* .，重复前一个操作
****
切换到编辑模式
* i/I，i是在光标所在处插入insert，I是在目前行的第一个非空格字符处插入。
* a/A，进入插入模式append，a是在光标后插入，A是在行最后一个字符处插入。
* o/O，插入模式，o在下一行插入新行，O在上一行插入新行。
* r/R，进入替换模式，r只会替换光标所在字符1次，R会一直替换直到按下ESC为止。
****
切换到命令行模式
* :w，将编辑内容写入文件
* :w!，强制写入只读文件（前提是你可以修改文件的权限）
* :q，退出vim
* :q!，丢弃修改退出vim
* :wq，写入并退出
* :wq!，强制写入并退出
* ZZ，保存后离开vim（没有冒号）
* :w FILENAME，另存一份到名为FILENAME的新文件中
* :r FILENAME，读入FILENAME的文件并将内容插入到光标所在行后面
* :n1,n2 w FILENAME，将第n1行到n2行之间的内容保存成新文件
* :! COMMAND，暂时离开vim而执行Linux命令，像ll这样的别名不能执行
* :set nu/nonu，设置vim环境显示行号/取消行号

打开文件时的警告：鸟哥提到vim通过在当前目录下创建.FILENAME.swp来暂存对文件的改动（但我按照他的方法测试后并没有发现这个隐藏文件，并且通过kill模拟意外退出再重新编辑该文件后也没有出现"Found a swap file by the name ..."的提示，所以这边只能看看理论）

出现该警告一般有两种情况：1.上次由于某些原因导致vim被中断；2.可能有其他人正在编辑该文件。vim提供了一些选项：
* [O]pen read-only，以只读方式打开。
* [E]dit anyway，以正常方式打开文件，并不会加载暂存文件。
* [R]ecover，加载暂存文件内容用于恢复。
* [D]elete it，删除暂存文件并继续编辑文件。
* [Q]uit，离开vim。
* [A]bort，同上。

### vim的功能
一、块选择：前面的操作都是以行为单位的操作，如果想要实现在sublime中的鼠标中键选择一块文本的功能，可以使用块选择。
* v，字符选择，会将光标经过的地方反白选择
* V，行选择，会将光标经过的行反白选择
* Ctrl + v，块选择，以光标起始点和结束点为顶点的矩形范围
* y，将反白的地方复制（yank）
* d，将反白的地方删除

二、多文件编辑：vim可以同时打开多个文件用于复制，我们在使用vim时后接多个文件来打开它们。
* :n，编辑下一个文件
* :N，编辑上一个文件
* :files，列出当前vim打开的所有文件

三、多窗口功能：如果一个文件非常大，通过`Ctrl + f`和`Ctrl + b`来翻页很麻烦或者有多个文件需要比较，这时就可以通过`:sp`（split）命令来分割窗口。
* :sp 或 Ctrl + w 再 s，分割窗口显示当前文件
* :sp FILENAME，分割窗口打开新文件
* Ctrl + w 再 h/j/k/l（或对应的方向键），将光标聚焦到对应方向的窗口
* Ctrl + w 再 H/J/K/L，调整光标所在窗口在显示器中的方位（类似于Windows Aero Snap）
* Ctrl + w 再 t/b/p，移动光标到左上角/右下角/上一次在的窗口
* Ctrl + w 再 q，退出关闭当前窗口
* 如果配置了`set mouse=a`那么可以通过鼠标调整各窗口的边框宽窄，否则通过`Ctrl + w 再 </>/+/-`可以微调水平尺寸与垂直尺寸。

四、vim配置：通过`:set all`能查看全部的vim设置，也可以直接配置~/.vimrc。这里提供一个比较舒服的配置。

:::details
```bash
"打开语法高亮
syntax on

"使用配色方案
colorscheme desert

"打开文件类型检测功能
filetype on

"不同文件类型采用不同缩进
filetype indent on

"允许使用插件
filetype plugin on
filetype plugin indent on

"关闭vi模式
set nocp

"与windows共享剪贴板
set clipboard+=unnamed

"取消VI兼容，VI键盘模式不易用
set nocompatible

"显示行号, 或set number
set nu

"历史命令保存行数 
set history=100 

"当文件被外部改变时自动读取
set autoread 

"取消自动备份及产生swp文件
set nobackup
set nowb
set noswapfile

"允许使用鼠标点击定位
set mouse=a

"允许区域选择
set selection=exclusive
set selectmode=mouse,key

"高亮光标所在行
"set cursorline

"取消光标闪烁
"set novisualbell

"总是显示状态行
set laststatus=2

"状态栏显示当前执行的命令
set showcmd

"标尺功能，显示当前光标所在行列号
set ruler

"设置命令行高度为3
set cmdheight=2

"粘贴时保持格式
set paste

"高亮显示匹配的括号
set showmatch

"在搜索的时候忽略大小写
set ignorecase

"高亮被搜索的句子
set hlsearch

"在搜索时，输入的词句的逐字符高亮（类似firefox的搜索）
set incsearch

"继承前一行的缩进方式，特别适用于多行注释
set autoindent

"为C程序提供自动缩进
set smartindent

"使用C样式的缩进
set cindent

"制表符为4
set tabstop=4

"统一缩进为4
set softtabstop=4
set shiftwidth=4

"允许使用退格键，或set backspace=2
set backspace=eol,start,indent
set whichwrap+=<,>,h,l

"取消换行
set nowrap

"启动的时候不显示那个援助索马里儿童的提示
"set shortmess=atI

"在被分割的窗口间显示空白，便于阅读
set fillchars=vert:\ ,stl:\ ,stlnc:\

"光标移动到buffer的顶部和底部时保持3行距离, 或set so=3
set scrolloff=3

"设定默认解码
set fenc=utf-8
set fencs=utf-8,usc-bom,euc-jp,gb18030,gbk,gb2312,cp936

"设定字体
set guifont=Courier_New:h11:cANSI
set guifontwide=新宋体:h11:cGB2312

"设定编码，如要使用中文将下面的两行取消注释即可
set enc=utf-8
set fileencodings=ucs-bom,utf-8,chinese
"set langmenu=zh_CN.UTF-8
"language message zh_CN.UTF-8
source $VIMRUNTIME/delmenu.vim
source $VIMRUNTIME/menu.vim

"自动补全
filetype plugin indent on
set completeopt=longest,menu

"自动补全命令时候使用菜单式匹配列表
set wildmenu
autocmd FileType ruby,eruby set omnifunc=rubycomplete#Complete
autocmd FileType python set omnifunc=pythoncomplete#Complete
autocmd FileType javascript set omnifunc=javascriptcomplete#CompleteJS
autocmd FileType html set omnifunc=htmlcomplete#CompleteTags
autocmd FileType css set omnifunc=csscomplete#CompleteCSS
autocmd FileType xml set omnifunc=xmlcomplete#CompleteTags
autocmd FileType java set omnifunc=javacomplete#Complet
```
:::

**其它注意事项**
vim将用户的对于文件的编辑信息（例如搜索过的pattern、编辑位置）记录在~/.viminfo中。

建议大家文件编码为utf-8，但某些Windows上简体中文编码默认为gb2312，可以设置机器的语系`LANG=zh_CN.gb2312`来临时解决。

Windows和Linux/Mac的断行不同，前者采用CRLF（\r\n），而后者采用LF（\n），所以在不同操作系统间传输文件时可能需要转换。

## 第11章 认识与学习bash
操作系统通过内核来管理硬件，但用户不能直接操作内核，一般用户只能通过shell来和内核进行通信。我们可以在/etc/shells这个文件中查看可以使用哪些shell。
```bash
➜  ~ cat /etc/shells      
/bin/sh # Bourne Shell
/bin/bash # Bourne Again Shell，默认取代了Bourne Shell
/bin/tcsh
/bin/csh
/bin/zsh # 基于贝尔实验室开发的ksh而来
```
在/etc/passwd这个文件中记录了每个用户默认登陆后使用什么shell，下面的/sbin/nologin就是一种奇怪的shell，让用户无法以其它服务登录主机。
```bash
➜  ~ cat /etc/passwd
root:x:0:0:root:/root:/bin/zsh
bin:x:1:1:bin:/bin:/sbin/nologin
daemon:x:2:2:daemon:/sbin:/sbin/nologin
```
Linux的默认shell是bash，高版本的MacOS将默认shell改为了zsh，我个人使用zsh并启用了oh my zsh。但通常使用上zsh和bash基本一致，只是一些体验不同。

### bash的功能
bash具有丰富的功能，zsh也类似：
* 命令历史记录，在~/.bash_history中记录了bash执行的命令历史记录，可以通过上下方向键或者history命令查看。
* 命令与文件补全功能，按下tab能补全。
* 命令别名设置，输入`alias`可以查看当前shell设置了哪些别名，例如`ll='ls -lh'`。也可以通过`alias lm='ls -la'`这样的命令来设置别名。
* 作业控制、前台后台控制，通过该功能可以在单一登录环境中达到多任务的目的。
* 程序脚本（Shell Script），可以将需要连续执行的命令写成一个脚本文件，该脚本可以通过交互式的方式来工作，也可以通过shell的环境变量来设计。
* 通配符（wildcard），bash支持许多通配符来帮助用户查询执行命令。

内置命令`type`：bash提供了一些内置命令如cd、umask，我们可以使用`type [-tpa] COMMAND`命令查看某个命令的类型，常用的选项有：
* -t，不加参数时，type会显示命令是外部命令还是内置命令。加上-t会显示是file（外部命令）、alias（别名）还是builtin（内置命令），（zsh下调用type不支持-t选项）。
* -p，显示外部命令包含完整path的文件名。
* -a，在PATH定义的所有路径中将所有含有COMMAND的命令都列出来。

bash内置的`ulimit`命令可以限制用户使用的某些系统资源，例如CPU时间、内存总量等。使用-a选项可以查看当前用户的限制（显示的信息中也说明了每个选项的含义）：
```bash
➜  ~ ulimit -a
-t: cpu time (seconds)              unlimited
-f: file size (blocks)              unlimited
-d: data seg size (kbytes)          unlimited
-s: stack size (kbytes)             8192
-c: core file size (blocks)         0
-m: resident set size (kbytes)      unlimited
-u: processes                       15024
-n: file descriptors                1024
-l: locked-in-memory size (kbytes)  64
-v: address space (kbytes)          unlimited
-x: file locks                      unlimited
-i: pending signals                 15024
-q: bytes in POSIX msg queues       819200
-e: max nice                        0
-r: max rt priority                 0
-N 15:                              unlimited
```
ulimit的其他选项：
* -H，硬limit，必定不能超过此值
* -S，软limit，超过此值会发出警告
* -c，进程出错系统产生的core file的最大容量
* -f，此shell可产生的最大文件容量
* -d，进程可使用的最大内存分段的容量data seg size
* -l，可用于锁定的内存量
* -t，可使用的CPU时间
* -u，单用户可以使用的最大进程量

### Shell的变量功能
变量简单来说就是用一个特定的简单字符来代表另一个比较复杂或者易变动的数据。例如，不同用户的变量`MAIL`指向不同的邮箱文件，那么不同的用户使用mail这个命令时，就会根据这个变量读取不同的邮箱文件。某些特定的变量会影响到bash的环境例如PATH、HOME、MAIL、SHELL等，为了区别与自定义变量的不同环境变量一般以大写字符表示。

另外，在编写shell script的时候，使用自定义变量很方便。例如需要用到某个很长的路径，使用变量只需要在前面定义一次后面就不需要反复输入这个很长的路径；同时如果以后要修改也只需修改前面变量的定义，而不是反复修改脚本中的多个地方。

一、变量定义的规则：我们可以使用`echo $variable`来查看“variable”这个变量，而设置变量则要满足一定规则：
* 变量名与变量内容以一个等号来连接，如`myName=Wallace`；等号两边不能有空格，像`my Name=Wallace`和`myName=Wallace Xu`这样都是错误的；变量名称只能由英文字符与数字组成，但开头不能是数字；变量内容中如果有空格可以用英文的双引号或单引号将变量内容括起来，但：
    * 双引号内的特殊字符如`$`等可以保持原有特性，如设置`var="lang is $LANG"`，则`echo $var`得到`lang is en_US.UTF-8`。
    * 单引号内的特殊字符如`$`仅为纯文本，如设置`var='lang is $LANG'`，则`echo $var`得到`lang is $LANG`。
* 可以用转义字符`\`将特殊符号如回车、dollar符、反斜线、空格、感叹号等变成一般字符。
* 如果需要在设置变量时调用其他命令，可以用两个重音符将命令括起来或者用`$(COMMAND)`，例如`version=$(uname -r)`再`echo $version`可以得到`3.10.0-1127.19.1.el7.x86_64
`。
    ```bash
    # 范例：如何进入到你当前内核的模块目录？
    cd /lib/modules/`uname -r`/kernel # ``之间的命令的输出会作为输入
    cd /lib/modules/$(uname -r)/kernel # 同上
    ```
* 增加已有变量的内容可以使用`"$变量名称"`或`${变量}`加要累加的内容，如：`PATH="$PATH":/home/bin`。
* 若该变量需要在其他子进程执行，则需要以`export VARIABLE`来使变量成为环境变量。

二、环境变量与自定义变量：使用`unset var`来取消设置变量。使用`env`可以查看当前所有的环境变量，像`HOME`、`SHELL`、`LANG`、这些都是常用的变量，值得一提的是`RANDOM`变量，目前的Linux Distribution基本上都会有随机数生成器`/dev/random`，我们可以通过该变量取得随机值，随机值在0~32767之间，要使用0~9之间的数值，利用declare声明数值类型：
```bash
declare -i number=$RANDOM*10/32768;echo $number
```

使用`set`可以查看所有的变量（包含环境变量与自定义变量）。像`$`本身也是一个变量，代表了当前shell的pid。用户在登录后拿到shell就是一个进程，在该进程下再执行bash就是前一个bash的子进程，子进程会继承父进程的环境变量，但不会继承父进程的自定义变量，所以通过`export`将变量变为环境变量就可以让该变量值继续存在于子进程中。
```bash
echo $$ # 查看当前shell的pid
echo $? # 查看上一个命令的回传码，上次成功的话回传码为0，否则非0
```

使用`locale`命令可以查看当前的语系设置，包括时间、货币、字符串格式等等，使用-a选项可以查看系统所有支持的语系。语系可以通过`LANG`这个环境变量修改。

三、使用`read`从键盘读取变量：该命令常用在shell script中，格式为`read [-pt] variable`，将用户输入的内容读取到变量variable中。-p选项可以后接自定义的提示字符串（prompt），-t选项后接最长等待的秒数，限定时间内用户没有输入则略过。

使用bash内置的`declare`或`typeset`命令（两者相同）可以声明变量的类型（默认为字符型）：
* -a，声明后接的变量为数组类型array
* -i，声明后接的变量为整数类型integer。如`declare -i sum=10+20`
* -x，export，将变量设为环境变量（+x是取消设为环境变量）
* -r，将变量设为只读，变量不可以被重设或修改
* -p，列出已经声明的某变量类型

bash环境中的数值运算只能为整形，所以1/3的结果为0。

数组类型的变量可以通过`variable[n]`来定义和访问，n就是索引index
```bash
➜  ~ var[1]=65        
➜  ~ var[2]=89
➜  ~ echo $var   
65 89
➜  ~ declare -p var
typeset -a var
var=(65 89)
```

四、变量内容的部分删除与替换：

通常访问变量的写法为`${variable}`，如果仅仅是读取内容那么我们往往将`echo ${variable}`简写成`echo $variable`，但是要在使用变量的同时作修改的话就一定要加上大括号，使用方法：

**从头或者尾删除一部分字符**
* `${variable#start*end}`，警号表示从变量内容开头向后寻找到首个内容为end的部分并删除之，星号为通配符可代表任意长度的字符，start和end不可以同时省略。
* `${variable##start*end}`，和上面不同之处在于##表示最长匹配，从开头向右删除能匹配的最长字符串。
* `${variable%start*end}`，从右向左搜索匹配的字符串并删除，最短匹配。
* `${variable%%start*end}`，从右向左删除，最长匹配。

**替换指定字符串**
* `${variable/oldStr/newStr}`，将从左到右首次出现的oldStr替换为newStr。
* `${variable//oldStr/newStr}`，将出现的所有oldStr替换为newStr。

**根据旧值是否存在进一步设置新值**
* `${oldVariable-newContent}`，如果variable存在则结果是variable的内容，否则就是newContent。可以将结果赋给newVariable，也可以赋给oldVariable（其实就是有就使用没有则默认设为newContent）。
* `variable=${variable:-newContent}`，如果变量内容为空或未设置都会被赋以新的内容。
* `variable=${variable+newContent}`，除了变量未被设置时外都将newContent赋给结果。
* `variable=${variable:+newContent}`，变量已设置且不为空时才将newContent赋给结果。
* 此外还有=、:=、?、:?暂时先略过。

### 命令别名与历史命令
一、别名alias：前面我们提到过常用的`ll`其实就是`ls -lh`的别名，在bash中可以使用`alias customName='COMMAND [-options]'`来设置别名，使用`unalias customName`可以取消别名，直接输入alias可以查看目前已经设置了那些别名。

二、历史命令history：使用history可以查看bash的历史记录（存储在~/.bash_history中），常用的参数和选项有：
* n，列出最近的n条记录（我试了下似乎总是显示全部历史记录）
* -c，清除目前shell的全部历史记录
* -a，将目前新增的命令历史追加写入到histfiles中，未指定则默认写入.bash_history
* -r，将histfiles的内容读到目前shell的history记忆中
* -w，立刻将目前的历史记录写入到histfiles中（默认是注销时写入）

历史记录不仅可以用来查询，也可以用来帮助执行命令。
* !n，执行记录中的第n条命令
* !!，执行上一条命令，例如执行命令并发现需要root权限可以使用`sudo !!`
* !COMMAND，执行最近的以COMMAND开头的命令，COMMAND可以不用写完整

注意如果同一个用户通过多个bash登录，最后一个注销的bash会覆盖掉前面的bash写入的会话内历史记录。

### Bash Shell的操作环境
一、执行命令的顺序：bash确定执行命令的位置的顺序是：相对绝对路径>别名>内置命令>$PATH中第一个找到的命令。

二、bash的登录与欢迎信息：在/etc/issue中记录了登录系统前看到的欢迎信息，默认内容是：
```bash
➜  ~ cat /etc/issue # 查看内容
\S
Kernel \r on an \m

# 登录前看到的欢迎信息
Cent0S Linux 7 (Core)
Kernel 3.16.B-1127.19.1.e17.x86_64 on an x86_64
```
内容中的转义字符含义如下：
* \d，本地端的日期
* \t，本地端的时间
* \l，显示是第几个终端机接口
* \m，显示硬件等级
* \n，显示主机的网络名称
* \o，显示domain name
* \r，显示操作系统的release版本
* \S，操作系统的名称
* \v，操作系统的版本

还可以编辑/etc/motd来在用户登录后显示提示信息。

三、bash的环境配置文件：因为配置文件的存在我们进入bash的时候不用每次都进行环境的配置。首先我们需要了解login shell和non-login shell的区别，关键在于有没有进行完整的登录流程（例如按CtrlAltF2在tty登录需要输入账号密码是login shell，而在X Window登录后打开的终端不需要输入账号密码是non-login shell，在bash中再执行bash也是non-login）。

login shell读取的配置有`/etc/profile`和`~/.bash_profile或~/.bash_login或~/.profile`。前者是系统整体的配置，可以利用UID来确定很多的变量数据例如PATH、USER、MAIL等，还会依次调用/etc/inputrc、/etc/profile.d/*.sh等配置；后者是用户个人配置，bash只会按顺序读取存在的第一个文件。修改完配置文件后一般要重新login才能应用修改，不过也可以使用`source ~/.profile`或`. ~/.profile`来立刻读入配置。non-login shell 会读取`~/.bashrc`。不过zsh配置似乎没有这么多。

此外，还可以用`stty`和`set`来对终端机进行设置（一般不用自行修改），`stty -a`和`echo $-`查看stty和set的所有配置。

四、通配符与特殊符号：常用的通配符有：
* `*`，代表0到任意多个字符
* `?`，代表一定有一个任意字符
* `[]`，代表一定有一个在中括号内的字符
* `[ - ]`，代表在减号两侧字符编码顺序内的所有字符，如[0-9]
* `[^ ]`，代表非括号内的任意字符

### 数据流重定向
Linux下标准输入stdin的代码为0，使用`<`或`<<`；标准输出stdout的代码为1，使用`>`或`>>`（覆盖或追加）；标准错误输出stderr的代码为2，使用`2>`或`2>>`。

stdout与stderror：
```bash
# 假设我们是普通用户wallace要在/home目录下搜索文件myFile
# 由于不具有其他用户主目录的访问权限所以我们会得到一些错误信息
# 默认情况下stdout和stderr都是屏幕，现在我们将二者重定向到两个文件中
find /home -name myFile > ~/list_right 2> list_error

# /dev/null是一个垃圾桶黑洞设备，会将所有导向这个设备的信息吃掉，可以用于忽略错误信息。
find /home -name myFile 2> /dev/null # 只有正确信息会显示到屏幕上

# 如果要将正确和错误信息同时写入到一个文件中可以使用&>或者2>&1
find /home -name myFile &> list
find /home -name myFile > list 2>&1
```
stdin：
```bash
# <代表将原本需要键盘输入的数据用文件内容来替代
cat > catfile < ~/.bashrc # 输入为.bashrc，cat的结果不会输出到屏幕而是catfile

# <<代表指定结束输入的关键字
cat > catfile << "eof" # 接下来在键盘输入内容，输入eof就结束输入而不需要按下ctrl+d，有助于编写程序
```