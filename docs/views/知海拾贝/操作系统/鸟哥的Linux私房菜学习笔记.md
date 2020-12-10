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
一、什么是数据流重定向

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

二、命令执行的判断依据; , && ||

在某些情况下我们想一次执行多条命令，这时我们可以使用shell script或者使用下面的符号来控制：
* `COMMAND1;COMMAND2`，这个在前面也提到过，用分号分隔两条命令，不考虑命令的相关性依次执行。
* `COMMAND1 && COMMAND2`，COMMAND1成功执行（True，回传码$? == 0）则执行COMMAND2，COMMAND1执行错误（False，回传码不等于0）则不执行COMMAND2。
* `COMMAND1 || COMMAND2`，COMMAND1成功执行则无需执行COMMAND2，COMMAND1执行错误才执行COMMAND2。上面这两条类似于编程语言中的短路机制。

示例1：不清楚/tmp/abc目录是否存在，但是最终一定要创建/tmp/abc/test这个文件
```bash
ls /tmp/abc || mkdir /tmp/abc && touch /tmp/abc/test
# 如果该目录存在即（真||？）第二条命令不执行，真值继续向后传递（真&&？）第三条命令需要执行
# 如果该目录不存在即（假||？）第二条命令执行，执行成功回传真（真&&？）第三条命令需要执行
```
示例2：要使得COMMAND1执行成功时则执行COMMAND2，否则执行COMMAND3。通常COMMAND2和COMMAND3都一定能执行成功。
```bash
COMMAND1 && COMMAND2 || COMMAND3 # 顺序不能错
```

### 管道命令
管道符号`|`仅能够将前面的命令传来的正确信息（stdout）用作后一个命令的输入。每个管道后面接的第一个数据必定是命令，并且该命令必须要能够加收stdin的数据才行（例如less、more、head、tail），而cp、ls、mv这些命令并不会接受stdin的数据。

一、选取命令：cut、grep

cut命令可以将同一行里面的数据进行分解，`-d`选项指定divider（默认为Tab），`-f`选项指定要取的第几个field，例如看起来可能让人觉得眼花缭乱的$PATH：
```bash
# 取出由冒号分割的第三段和第五段
➜  ~ echo $PATH | cut -d ':' -f 3,5 
/usr/local/rvm/rubies/ruby-2.7.0/bin:/root/perl5/bin
➜  ~ echo $PATH | cut -d ':' -f 3  
/usr/local/rvm/rubies/ruby-2.7.0/bin
➜  ~ echo $PATH | cut -d ':' -f 5
/root/perl5/bin

# 取得export命令输出的信息每行第12个字符后的所有字符串
export | cut -c 12- # -c选项表示以Character为单位取出固定字符区间，如12-20 或 12- 或 -20
```

grep的作用是分析一行的信息，若当中有我们所需要的信息就将该行拿出来。其语法为`grep [-acinv] [--color=auto] '查找字符串' inputFileName`，grep可以单独使用，如果放在管道符后使用就不需要输入文件名了，也支持使用正则表达式进行搜索。各选项的含义为：
* -a，将二进制文件当作文本文件来查找数据
* -c，--count，计算找到'查找字符串'的次数
* -i，--ignore-case，忽略大小写的不同
* -n，顺便输出行号
* -v，--invert-match，反向选择没有查找字符串的行
* --color=auto，将找到的关键字加上颜色显示

二、排序命令：sort、wc、uniq

`sort`这个命令可以依据不同的数据类型来对行进行排序。用法为`sort [-fbMnrtuk] [file or stdin]`，常用的选项有：
* -f，--ignore-case，忽略大小写的差异
* -b，--ignore-leading-blanks，忽略最前面的空格部分
* -M，以月份的名字（`(unkoown)<JAN<...<DEC`）来排序
* -n，使用纯数字进行排序（默认使用字典序进行排序）
* -r，--reverse，反向排序
* -u，--unique，相同数据中仅出现一行代表
* -t，--field-separator=SEP，使用指定分隔符（默认为Tab）
* -k，--key=KEYDEF，以哪个区间为key来进行排序

示例：
```bash
# 将/etc/passwd的内容取出并按照冒号分隔的第三列进行排序
➜  ~ cat /etc/passwd | sort -t ':' -k 3 # 默认按照字典序排序，如果需要按照数字排序需要加上-n
root:x:0:0:root:/root:/bin/zsh
wallace:x:1000:1000:wallace:/home/wallace:/bin/bash
qemu:x:107:107:qemu user:/:/sbin/nologin
operator:x:11:0:operator:/root:/sbin/nologin

# 将last命令得到的登录历史的第一列（帐号）取出并加以排序
➜  ~ last | cut -d ' ' -f 1 | sort  

reboot
reboot
root
```

如果排序完成了想要将重复的数据仅列出一行显示，可以使用`uniq`命令，注意要在排序后使用uniq否则只会统计相邻且相同的行的出现次数。使用-i选项可以忽略大小写的不同、使用-c选项可以统计相同行出现的次数，示例：
```bash
# 想要根据用户、登录终端类型和用户地址的不同排序并统计次数，而不用管后面的登录时间
➜  ~ last | cut -c -38 | sort | uniq -c
      1 
     13 reboot   system boot  3.10.0-1127.10.1
     21 reboot   system boot  3.10.0-1127.19.1
      3 reboot   system boot  3.10.0-1127.el7.
      1 root     :0           :0              
      1 root     pts/0        :0              
      1 root     pts/0        192.168.0.8     
     14 root     pts/0        gateway         
      1 root     pts/1        192.168.0.8     
      7 root     pts/1        gateway         
      5 root     pts/2        gateway         
      3 root     pts/3        gateway         
      3 root     pts/4        gateway         
      3 root     pts/5        gateway         
      3 root     pts/6        gateway         
      3 root     pts/7        gateway         
      3 root     pts/8        gateway         
      3 root     pts/9        gateway         
      3 root     tty2                         
     27 wallace  :0           :0              
     31 wallace  pts/0        :0              
      7 wallace  pts/1        :0              
      1 wallace  pts/1        gateway         
      1 wallace  pts/2        :0              
      1 wallace  tty2                         
      1 wtmp begins Fri Jun 19 21:45:32 2020
```
使用`wc`（word counts）命令可以统计输入数据中有多少行、多少词、多少字符，默认输出三个数字代表前者。常用选项有：
* -l，--lines，仅显示行数
* -w，--words，仅显示单词数
* -m，--chars，仅显示字符数
* -c，--bytes，仅显示字节数

示例：
```bash
# 在上面的例子中，last的输出中有一个空行，同时有一个非正常帐号wtmp，现在需要统计记录总共的登录人次
➜  ~ last | cut -d ' ' -f 1 | grep '[a-zA-Z]' | grep -v 'wtmp' | wc -l
159
```

三、双向流重定向`tee`：该命令可以从stdin中读入数据，并在原封不动的输出到stdout的同时将数据输出到指定文件中，可以用作记录中间暂存数据。选项有-a（--append）追加到文件中，-i（--ignore-interrupts）忽略中断信号。
```bash
# 将last的结果存一份到文件last.list中再交由cut处理后输出到屏幕
last | tee -a last.list | cut -d '' -f 1
```

四、字符转换命令tr、col、join、paste、expand

`tr`：translate or delete characters，可以用来删除一段信息中的文字，或者进行文字信息的转换。用法为`tr [-ds] 字符集1 ...`，字符集就是正则表达式中的字符集格式。示例：
```bash
# 将last输出的信息中所有小写字符转换为大写字符
➜  ~ last | tr '[a-z]' '[A-Z]'

# 将读取$PATH输出的信息中的冒号删除
➜  ~ echo $PATH | tr -d ':'      
/usr/local/rvm/gems/ruby-2.7.0/bin/usr/local/rvm/gems/ruby-2.7.0@global/bin/usr/local/rvm/rubies/ruby-2.7.0/bin/usr/lib64/qt-3.3/bin/root/perl5/bin/usr/local/sbin/usr/local/bin/sbin/bin/usr/sbin/usr/bin/root/bin/usr/local/rvm/bin

# 将/etc/passwd转存到/root/passwddos文件中并将line separator改为DOS风格（CRLF）
➜  ~ cat /etc/passwd | tr '\n' '\r\n' > /root/passwddos 
➜  ~ file /etc/passwd ./passwddos 
/etc/passwd: ASCII text
./passwddos: ASCII text, with CR line terminators
```

`col`：可用于简单处理Tab和空格之间的转换（但我个人感觉`tr '\t' ' '`也能做到并且更好记一点）。

`join`：join可以将两个文件当中有相同数据的行合并到一起，参数有：
* -t，和sort一样，指定分隔符
* -i，忽略大小写区别
* -1 n，第一个文件用第n个字段作为key
* -2 n，第二个文件用第n个字段作为key

在我个人看来更像是类似于按照数据库的key进行连表操作（数据库中表的连接也成为join），假如我们要处理两个文件：
```bash
# 两个文件分别以uid为主键记录了一些指标
➜  ~ cat file1                         
id1:wallace:male
id2:tony:male
id5:kale:male
➜  ~ cat file2
id1:16:20KG
id1:17:21KG
id3:18:21KG
id4:23:17KG
id5:24:33KG

# 现在要以两个文件的第一列为key连接两个文件
➜  ~ join -t ':' file1 file2 # 默认以第一个字段为key
id1:wallace:male:16:20KG
id1:wallace:male:17:21KG
id5:kale:male:24:33KG

# 分别指定两个文件的key
➜  ~ join -t ':' -1 4 /etc/passwd -2 3 /etc/group
0:root:x:0:root:/root:/bin/zsh:root:x:
1:bin:x:1:bin:/bin:/sbin/nologin:bin:x:
2:daemon:x:2:daemon:/sbin:/sbin/nologin:daemon:x:
4:adm:x:3:adm:/var/adm:/sbin/nologin:adm:x:
join: /etc/passwd:6: is not sorted: sync:x:5:0:sync:/sbin:/bin/sync # 值得注意的是文件要事先按照key排序否则有些信息会被略过
7:lp:x:4:lp:/var/spool/lpd:/sbin/nologin:lp:x:
join: /etc/group:11: is not sorted: wheel:x:10:wallace
99:nobody:x:99:Nobody:/:/sbin/nologin:nobody:x:
65:pegasus:x:66:tog-pegasus OpenPegasus WBEM/CIM services:/var/lib/Pegasus:/sbin/nologin:pegasus:x:
```

`paste`：和join相比，paste只是简单地将文件每行之间粘贴在一起并用Tab分隔而已。不过join只能处理两个文件，paste可以处理多个文件或stdin，例如：
```bash
# 将/etc/group读出然后与/etc/passwd /etc/shadow粘贴在一起，最后取出前三行
➜  ~ cat /etc/group | paste /etc/passwd /etc/shadow - | head -n 3 # 注意paste最后的“-”，会被当做stdin/stdout
```

`expand`的作用是将Tab用一定数量的空格替换（默认为8个空格，可以使用-t选项指定空格的个数）

五、切割命令`split`：split命令可以将一份stdin数据分割成多个文件，用法为`split [-bl] file PREFIX`，-b选项指定单个分割的大小如300k/20m，-l选项指定按行数来切割，PREFIX是分割后文件名的前缀（前缀后会自动加上aa,ab,ac,...这样的后缀）。示例：
```bash
# 将文件myfile分割为300kb大小的小文件
split -b 300k ./myfile splitfile
# 将这些文件再合成一个文件
cat splitfile* >> myfile
# 将ls命令的结果每10行记录成一个文件
ls -la / | split -l 10 - lsroot
``

六、参数代换`xargs`：该命令可以读入stdin的数据并以空格符或者断行字符进行分辨，将数据分割成arguments传递给后面的命令执行。由于很多命令不支持管道命令，xargs可以在该命令和stdin之间架起桥梁。示例：
```bash
# finger命令可以查询用户帐号的相关说明（可能需要用yum安装一下）
# 我们取出/etc/passwd前三行第一列的用户名再作为参数交给finger查询
# 先用cut选列还是先用head选行都可以
head /etc/passwd -n 3 | cut -d ':' -f 1 | xargs finger
cut -d ':' -f 1 /etc/passwd | head -n 3 | xargs finger
```
xargs还可以使用以下选项：
* -0，将含有的特殊字符还原成一般字符
* -e'eof'，后接指定的eof（没有空格），分析到该字符串就停止处理
* -p，处理每个参数都要询问用户
* -n，后接每次command命令执行时要使用几个参数

## 第12章 正则表达式与文件格式化处理
正则表达式是一种表示方法，可以理解为以行为单位来进行字符串的处理行为，通过一些特殊符号的辅助，可以让用户轻易达到查找、删除、替换某特定字符串的目的。vi、grep、awk、sed等工具支持正则表达式，而cp、ls等命令没有支持正则表达式只能使用bash自身的通配符。

> 感觉这部分鸟哥更多是举例子，没有高淇老师讲得系统，所以下面只是列举用法，想要系统学习的话可以看高淇老师的Java300集中对应的那几节。

首先我们需要了解一些特殊符号（其实是自定义字符集）：
* `[:digit:]`，代表0~9
* `[:alnum:]`，26个字母的大小写和数字
* `[:alpha:]`，26个字母的大小写
* `[:lower:]`，代表26个小写字母
* `[:upper:]`，代表26个大写字母
* `[:blank:]`，空格与Tab键
* `[:graph:]`，代表除空格和Tab外其他的所有按键
* `[:cntrl:]`，代表控制按键包括CR、LF、Tab、Del等
* `[:print:]`，代表任何可以被打印出来的字符
* `[:punct:]`，代表标点符号，即`"'?!;:#$`
* `[:space:]`，任何会产生空白的字符例如空格、Tab、CR等
* `[:xdigit:]`，代表16进制数0~9、a~f、A~F

### 基础正则表达式
grep可以后接-A（--after-context=NUM）或-B（--before-context=NUM）来指定找到显示关键字所在行的后n行和前n行。下面通过示例来说明如何在grep中使用正则表达式：
```bash
# 1.查找特定字符串
# 在文件regular_express.txt中查找有“the”的行并显示行号
grep -n 'the' regular_express.txt
# 反向查找，即查找没有“the”的行
grep -nv 'the' regular_express.txt
# 查找有“the”的行，不论大小写
grep -ni 'the' regular_express.txt

# 2.用[]来查找字符集
# 查找有“test”或taste的行
grep -n 't[ae]st' regular_express.txt # 其实这样不是很严谨，找的是test或tast
# 查找含有“oo”但“oo”之前不是“g”的行
# 中括号里第一个字符是“^”表示对该自定义字符集反向选择，不能出现其中的字符
grep -n '[^g]oo' regular_express.txt # 一行同时出现满足和不满足的也会被找出
# 找出包含“oo”前的字符不是小写字符的行
grep -n '[^[:lower:]]oo' regular_express.txt
grep -n '[^a-z]oo' regular_express.txt

# 3.行首与行尾字符^$
# 查找行首是小写字符的行
grep -n '^[a-z]' regular_express.txt
grep -n '^[[:lower:]]' regular_express.txt
# 查找行尾是“.”的行
grep -n '\.$' regular_express.txt # 点号表示任意一个字符，需要转义，如果是CRLF换行符会找不到
# 查找空白行
grep -n '^$' regular_express.txt

# 4.任一字符.和重复字符*
# 查找有g和d之间有两个任意字符的行
grep -n 'g..d' regular_express.txt
# 查找含有以“g”和“g”开头和结尾的字符串的行
grep -n 'g.*g' regular_express.txt

# 5.使用量词{}
# 查找含有连续两个o的字符串的行
grep -n 'o\{2\}' regular_express.txt # 由于在shell中大括号有特殊意义所以需要转义
# 查找以g开头结尾并且中间有且仅由2~5个o的字符串
grep -n 'go\{2,5\}g' regular_express.txt
# 查找以g开头结尾并且中间有且仅由2个以上的o构成字符串
grep -n 'go\{2,\}g' regular_express.txt
```

练习：找出/etc/下文件类型为连接文件的文件名：
```bash
# 没法用分隔符分割，我数了一下，ls的结果从49个字符开始是文件名
➜  ~ ls -l /etc | grep '^l' | cut -c 49- 
extlinux.conf -> ../boot/extlinux/extlinux.conf
```

**sed工具**

sed（stream editor）流编辑器是一个强大的工具，可以用于将数据进行替换、删除、新增选取特定行等功能，可以处理stdin。sed的参数除了选项还有动作，用法为`sed [OPTION] 'SCRIPT' [stdin]`。常用的选项有：
* -n，--quiet，--silent，使用安静模式只输出经过处理的行（默认输出所有行）
* -e SCRIPT，--expression=SCRIPT，在命令行模式上进行sed的动作编辑（没有-e其实也行）
* -f SCRIPT-FILE，--file=SCRIPT-FILE，执行写入到文件中的动作
* -r，--regexp-extended，让sed支持扩展正则表达式（默认仅支持基础正则表达式语法）
* -i SUFFIX，--in-place=SUFFIX，直接修改读取文件的内容而不是由屏幕输出

选项后还要接上动作`[n1[,n2]] function`，n1和n2可选，表示后面的function动作要在那些行之间进行，动作需要用单引号括起来。常用的function有：
* a，新增，a后接字符串，这些字符串会在当前行的下一行出现
* i，插入，i后接字符串，这些字符串会在当前行的上一行出现
* c，替换，c后接字符串，这些字符串会替换n1和n2之间的行
* d，删除
* p，打印，将选择的数据打印出来
* s，替换，格式为s/regexp/replacement/g

看理论不好理解，我们看一组示例：
```bash
# 1. 将/etc/passwd的内容连同行号输出，同时删除2~5行
➜  ~ nl /etc/passwd | sed '2,5d' # 只删除第二行'2d' 删除第二行到最后一行'2,$d'
     1	root:x:0:0:root:/root:/bin/zsh
     6	sync:x:5:0:sync:/sbin:/bin/sync
     7	shutdown:x:6:0:shutdown:/sbin:/sbin/shutdown 

# 2. 将/etc/passwd的内容连同行号输出，同时在第2~3行每行后追加一行“drink tea”
➜  ~ nl /etc/passwd | sed '2,3a drink tea' # 范围参数同上，如果要在每行前插入的话将a改为i即可，如果要插入多行可以用反斜线转义回车
➜  ~ nl /etc/passwd | sed '2,5a drink tea'
     1	root:x:0:0:root:/root:/bin/zsh
     2	bin:x:1:1:bin:/bin:/sbin/nologin
drink tea
     3	daemon:x:2:2:daemon:/sbin:/sbin/nologin
drink tea
     4	adm:x:3:4:adm:/var/adm:/sbin/nologin
     5	lp:x:4:7:lp:/var/spool/lpd:/sbin/nologin

# 3. 将第2~5行的内容替换为hello world
➜  ~ nl /etc/passwd | sed '2,5c hello world'
     1	root:x:0:0:root:/root:/bin/zsh
hello world
     6	sync:x:5:0:sync:/sbin:/bin/sync

# 4. 仅列出文件的第5~7行
➜  ~ sed -n '5,7p' /etc/passwd # 如果不使用-n选项，默认全部输出，并且在5~7行会重复输出一次

# 5. 使用正则表达式在行内搜索对应的pattern并予以替换
# 例如从ifconfig的输出中找到网卡的IPv4地址所在的行
➜  ~ ifconfig enp0s3 | grep 'inet '
        inet 10.0.2.15  netmask 255.255.255.0  broadcast 10.0.2.255
# 接下来要使用正则表达式两ip地址前的内容删掉（替换为空字符）
➜  ~ ifconfig enp0s3 | grep 'inet ' | sed 's/^.*inet //g'
10.0.2.15  netmask 255.255.255.0  broadcast 10.0.2.255
# 再将ip地址后的内容删除
➜  ~ ifconfig enp0s3 | grep 'inet ' | sed 's/^.*inet // g' | sed 's/ netmask.*$//g'
10.0.2.15 

# 7. 综合练习：查看/etc/man_db.conf的内容中含有“MAN”的行，但不显示批注
# 鸟哥给的解法是cat读出->grep找到有“MAN”的行->用sed将含有注释的行替换为空行->用sed删除空行
➜  ~ cat /etc/man_db.conf | grep 'MAN' | sed 's/^#.*$//g' | sed '/^$/d'
# 也可以先用sed将含有注释的行替换为空行，再用grep找到有“MAN”的行
➜  ~ sed 's/^#.*$//g' /etc/man_db.conf | grep 'MAN' 
# 其实这个需求直接用grep就能实现了
➜  ~ grep -v '#' /etc/man_db.conf | grep 'MAN'  
MANDATORY_MANPATH			/usr/man
MANDATORY_MANPATH			/usr/share/man
MANDATORY_MANPATH			/usr/local/share/man
（省略）

# 8. 用sed直接修改文件内容而非使用stdout
# 将regular_express.txt每行结尾的点号替换成感叹号
➜  ~ sed -i 's/\.$/\!/g' regular_express.txt  
# 在该文件的最后一行追加一行“# This is a test.”
➜  ~ sed -i '$a # This is a test.' regular_express.txt 
# 不打开vim或者gedit编辑器，在一个100万行的文件myFile.csv的第10000行后插入一行“100,120,130”
➜  ~ sed -i '10000a 100,120,130' myData.csv
```

### 扩展正则表达式
扩展正则表达式能够简化某些场景下基础正则表达式的写法。例如，原来我们要使用grep剔除注释和空行后显示文件内容需要用两次grep：
```bash
grep -v '^$' file.txt | grep -v '^#'
```
使用扩展正则表达式可以简化为：
```bash
# grep -E启用扩展正则支持；或直接使用egrep
grep -vE '^$|^#' file.txt # 扩展正则表达式可以通过|实现分组功能
```
扩展正则表达式的字符有：
* +，表示前一个字符至少出现1次，至多无数次
* ?，前一个字符出现0次或1次
* |，用或的逻辑找出多个字符串
* ()，捕获组。后面可以接量词，括号内表示一个整体。括号内也可以使用“或”并将公共的字符放在括号两侧。

### 文件的格式化与相关处理

一、格式化打印printf：后面提到的awk以及c语言中都是利用printf进行。使用的格式为`printf '打印格式' 实际内容`，一些特殊的格式有：
* \a，alert，警告声音
* \b，backspace，退格
* \f，from feed，清除屏幕
* \n，new line，输出新的一行
* \r，return，回车键
* \t，tab键
* \v，垂直的tab键
* \xNN，输出十六进制数NN代表的字符

```bash
# 示例：从文本中读出每一行的数据并尝试按照打印格式打印出来
# 格式化字符串中的空格也会被打印
➜  ~ printf '%10s %5i %5i %5i %8.2f \n' `cat printf.txt`                  
# 这一行是表格的标题，由于后面都不能被格式化为数值所以显示都是0，可以过滤掉：`cat printf.txt | grep -v 'Name'`
      Name     0     0     0     0.00  
    DmTsai    80    60    92    77.33 
     Vbird    75    55    80    70.00 
       Ken    60    90    70    73.33 
```

二、awk：好用的数据处理工具

awk的格式为：`awk '条件类型1{动作1} 条件类型2{动作2} ...' 文件名`，awk以一行为一次处理的单位，以字段为最小处理的单位（字段之间以空格或Tab隔开）。awk最常用的动作是通过print的功能将字段数据列出来，我们举个例子：
```bash
# 使用last查看最近的系统登录记录
➜  ~ last -n 5                
wallace  pts/0        :0               Mon Nov 23 10:22   still logged in   
wallace  :0           :0               Mon Nov 23 10:22   still logged in   
reboot   system boot  3.10.0-1160.2.2. Mon Nov 23 10:21 - 16:57  (06:35)    
wallace  pts/0        :0               Fri Nov 20 16:02 - 20:31  (04:28)    
wallace  :0           :0               Fri Nov 20 16:02 - down   (04:28)  
# 在前面的基础上取出第一列和第三列
➜  ~ last -n 5 | awk '{print $1 "\t" $3}' # awk后的动作是以单引号括住的，里面的格式化字符串用双引号
wallace	:0
wallace	:0
reboot	boot # 能看到由于默认用空格或Tab区分fields，所以这里没有取到预想的部分
wallace	:0
wallace	:0
```
awk中也内置了一些**相关的变量**，例如`NF`（Number of fields，每一行拥有的字段）、`NR`（Number of input records so far，目前已处理的行数）、`FS`（Field Separator，字段分隔符，默认是空格），例如显示当前处理到哪一行以及当前行有多少列：
```bash
# 源数据
➜  ~ last -n 5 | sed '6,7d'                                                   
wallace  pts/0        :0               Mon Nov 23 10:22   still logged in   
wallace  :0           :0               Mon Nov 23 10:22   still logged in   
reboot   system boot  3.10.0-1160.2.2. Mon Nov 23 10:21 - 20:04  (09:43)    
wallace  pts/0        :0               Fri Nov 20 16:02 - 20:31  (04:28)    
wallace  :0           :0               Fri Nov 20 16:02 - down   (04:28)  
# 使用awk处理
➜  ~ last -n 5 | sed '6,7d' | awk '{print $1 "\tlines: " NR "\tcolumns: " NF}'
wallace	lines: 1	columns: 10
wallace	lines: 2	columns: 10
reboot	lines: 3	columns: 11
wallace	lines: 4	columns: 10
wallace	lines: 5	columns: 10
```
例子2：
```bash
# 从/etc/passwd中找出第三个字段代表的uid小于10的用户，并且仅打印还用户的用户名和uid
➜  ~ cat /etc/passwd | awk 'BEGIN {FS=":"} $3 < 10 {print $1 "\t" $3}'
root	0
bin	1
daemon	2
adm	3
lp	4
sync	5
shutdown	6
halt	7
mail	8
```

例子3：
```bash
# 我们用vim创建这样的一个文件
➜  ~ cat pay.txt
Name	1st		2nd		3th
Vbird	23000	24000	25000
DMtsai	21000	20000	23000
Wallace	43000	42000	41000
# 使用awk处理，如果是第一行就打印相应的标题，如果行数大于等于2就计算第2~4字段的总和并一并打印出来
➜  ~ cat pay.txt | awk 'NR==1{printf "%10s %10s %10s %10s %10s\n",$1,$2,$3,$4,"Total"} NR>=2{total = $2 + $3 + $4; printf "%10s %10d %10d %10d %10.2f\n",$1,$2,$3,$4,total}'
# 上面的第二个动作中涉及了两个行为：变量赋值和printf，需要用封号隔开，也可以用回车
      Name        1st        2nd        3th      Total
     Vbird      23000      24000      25000   72000.00
    DMtsai      21000      20000      23000   64000.00
   Wallace      43000      42000      41000  126000.00
```
awk的功能非常强大丰富，我们暂时只了解到这里。

三、文件比较工具

`diff`一般用于ASCII纯文本文件的比较（也可以用于比较两个目录），并且以行为比较单位。用法为`diff [-bBi] from-file to-file`，两个文件之一可以用`-`代替来代表stdin，选项有：
* -b，忽略一行中多个空白的区别，如`hello world`和`hello   world`视为相同
* -B，忽略空白行的区别
* -i，忽略大小写的区别

`cmp`一般用于以字节为比较单位去比较两个文件，用法和diff类似，选项有-s用于将所有不同点的字节处都列出来（默认只会输出第一个不同点的位置）。

`patch`工具可以将diff工具产生的patch文件作为补丁打到旧文件上去，例如：
```bash
# 使用diff比较两个文件并制作patch文件
diff -Naur password.old password.new > paswword.patch
# 使用patch来更新旧版数据
patch -p0 < password.patch # -p后面的数字表示要减去几层目录，在整体比较目录时该数字一般大于0
# 使用patch来回复旧文件的内容
patch -R -p0 < password.patch # -R表示恢复文件
```

此外，可以在打印文件前用`pr`（convert text files for printing）来进行格式预处理，例如加入页面标题等等。

## 第13章 学习shell script
shell script可以跨平台运行，语法相当亲和，用处很多：
* 帮助系统管理员进行自动化管理，例如查询登陆文件、追踪流量、、监控用户使用主机状态、监控硬件设备状态等。
* 检查对应的shell script可以用于追踪管理系统时出现的问题。
* 可以编写shell script以实现简单的入侵检测功能，并立即通报管理员或者加强防火墙的设置规则。
* 将一连串连续的命令单一化（本博客下的deploy.sh就是这样的一个脚本）。
* 进行简易的数据处理（处理大量数值运算时速度就不如传统的编程语言了）。

编写及运行shell script的一些注意事项：
* 脚本是逐行解释执行的，空白行会被忽略，多个空格和Tab都会被视为一个空格，如果读到一个换行则尝试执行该行的命令，可以用`\Enter`扩展至下一行。
* 使用路径执行脚本：该脚本必须有rx权限，这时可以用绝对路径`/absPath/myScript.sh`、相对路径`./myScript.sh`或者将脚本放入$PATH指定的目录下。
* 使用bash命令执行脚本：该脚本只需要r权限即可，通过`sh或bash 脚本的绝对或相对路径`即可在执行该脚本，这种方式还可以使用bash的一些选项来对脚本进行检查。
* 使用`source myScript.sh`执行脚本，前面两种方式都是在一个新的bash子进程中执行，执行完毕后子进程的变量不会传回父进程中，而source则是直接在当前bash进程中执行，变量设置等操作会保持有效。

我们要养成良好的shell script编写习惯：
* 在每个脚本的头部记录好脚本的功能、版本信息、作者与联络方式、版权声明方式、历史记录
* 脚本内较为特殊的命令使用绝对路径执行
* 脚本执行时需要的环境变量要预先声明并设置
* 最好能想Python中那样用Tab进行缩进排版，增加可读性。

### 简单的shell script练习
一、交互式脚本，变量由用户的输入决定。通过`read -p`实现交互式变量输入。
```bash
#!/bin/bash
# Program:
#	This program shows full name input by user.
# History:
# 2020/11/24 Wallace First Release
PATH=$PATH:/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin
export PATH

read -p "Please inout your first name:" firstname
read -p "Please inout your last name:" lastname
echo -e "Your full name is $firstname $lastname"
exit 0
```
二、利用日期动态地创建不同文件名的文件。我们常常遇到这样的一种场景：想要自动记录某种特定的日志服务，将每天的内容记录到一个单独的文件中。我们希望文件名有一个统一的前缀用于表示文件内容，同时又希望文件名后面包含该文件对应的日期。
```bash
➜  scripts cat sh03.sh    
#!/bin/bash
# Program:
#	This program create a series of files with same prefix while distincted by date.
# History:
# 2020/11/24 Wallace First Release
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin
export PATH

# 提示用户输入前缀
echo -e "This program will use 'touch' command to create 3 files."
read -p "Please input your file prefix:" file_prefix
filename=${file_prefix:-"filename"} # 分析是否已经设置文件前缀

# 获取三个时间并设置到变量中
date1=$(date --date='2 days ago' +%Y%m%d)
date2=$(date --date='1 days ago' +%Y%m%d)
date3=$(date +%Y%m%d)
# 将前缀和时间变量拼接成新变量
file1=${filename}${date1}
file2=${filename}${date2}
file3=${filename}${date3}

# 使用拼接后的文件名创建文件
touch "$file1"
touch "$file2"
touch "$file3"
```

三、进行简单的整数四则运算、求余数运算
```bash
➜  scripts cat sh04.sh 
#!/bin/bash
# Program:
#	This program does simple integer calculation.
# History:
# 2020/11/24 Wallace First Release
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin
export PATH

read -p "Input first integer to multiply:" number1
read -p "Input second integer to multiply:" number2
# 这里也可以使用declare -i total=$number1*$number2
result=$(($number1*$number2)) # 乘号左右的空格可加可不加
# 这里后面要直接加句点所以得用花括号区隔，否则花括号可以省略
echo -e "Result of $number1 * $number2 is: ${result}."
```
`$((数值运算内容))`是一个常用的形式，建议使用这种方式：
```bash
➜  scripts echo 13%3 # 默认是作为字符串，加上引号也一样
13%3
➜  scripts echo $((13%3))
1
➜  scripts echo $(13%3)  # 13%3本身不是命令所以报错
zsh: 13%3: command not found...
zsh: command not found: 13%3
```

### 判断式`test`和`[]`
前面提到过使用`||`和`&&`可以根据前一条命令的回传码来确定后面的命令是否执行。在bash中我们还有很多可用于判断的方法。

一、`test`命令可以用于测试很多条件是否成立，并且不会显示任何结果而是会根据结果返回不同的回传码。该工具可以检查很多东西，包括：

**测试文件类型**
* -e，该文件名是否存在（exist）
* -f，该文件名是否存在且为regular file
* -d，该文件名是否存在且为目录
* -b，该文件名是否存在且为block device
* -c，该文件名是否存在且为character device
* -S，该文件名是否存在且为一个Socket文件
* -p，该文件名是否存在且为一个pipe（FIFO）文件
* -L，改文件名是否存在且为一个link file

**测试文件权限（root权限常常有例外）**
* -r，该文件是否存在并对该文件有可读权限
* -w，该文件是否存在并对该文件有可写权限
* -x，该文件是否存在并对该文件有可执行权限
* -u，该文件是否存在并有SUID属性
* -g，该文件是否存在并有SGID属性
* -k，该文件是否存在并有Sticky bit属性
* -s，该文件是否存在并且非空（size greater than zero）

**测试比较两个文件的关系 如test file1 -nt file2**
* -nt，一个文件的mtime比另一个文件的mtime更新（newer than）
* -ot，一个文件的mtime比另一个文件的mtime更旧（older than）
* -ef，两个文件名是否指向同一个inode。（equal file）

**测试两个整数之间的关系 如test n1 -eq n2**
* -eq，两数是否相等
* -ne，两数是否不等
* -gt，n1是否大于n2
* -lt，n1是否小于n2
* -ge，n1是否大于等于n2
* -le，n1是否小于等于n2

**测试字符串的属性**
* -z，字符串长度是否为zero（空字符串）
* -n，字符串是否为非空（空则为false，-n可以省略）
* str1 = str2，测试两个字符串是否相等
* str1 != str2，测试两个字符串是否不等

**多重条件判定**
* -a，（and）如`test -r file -a -x file`在文件同时可读可执行时回传true。
* -o，（or）如`test -r file -o -x file`在文件可读或可执行时回传true。
* ！，（not）如`test ! -x file`在文件不具有可执行权限时回传true。

练习题：让用户输入一个文件名，我们要做到：
1. 这个文件是否存在，若不存在则给予一个“Filename does not exist”的讯息，并中断程序；
2. 若这个文件存在，则判断他是个文件或目录，结果输出“Filename is regular file”或“Filename is directory”
3. 判断一下，执行者的身份对这个文件或目录所拥有的权限，并输出权限数据！

我写的shell script如下：
```bash
#!/bin/bash
# Program:
#	This program use [test] command to print privileges.
# History:
# 2020/11/25 Wallace First Release
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin
export PATH

# test file type
read -p "Input a file path:" targetFile
test -e $targetFile || (echo "$targetFile does not exist."; exit 1) # 这边其实有一些逻辑问题
test -f $targetFile && echo "$targetFile is a regular file."
test -d $targetFile && echo "$targetFile is a directory."

# test privileges
echo "Your privileges for the file is:$(test -r $targetFile && echo 'r')$(test -w $targetFile && echo 'w')$(test -x $targetFile && echo 'x')"
```
执行脚本的结果如下：
```bash
# 当前目录下有一个普通文件和目录，当前用户root的权限也如下所示
➜  scripts ll
total 20K
drwxr-xr-x. 2 root root   6 Nov 24 17:59 pp
-rw-r--r--. 1 root root 626 Nov 25 16:13 sh05.sh
➜  scripts sh sh05.sh
Input a file path:pp
pp is a directory.
Your privileges for the file is:rwx
➜  scripts sh sh05.sh
Input a file path:./sh05.sh
./sh05.sh is a regular file.
Your privileges for the file is:rw
➜  scripts sh sh05.sh
Input a file path:/dummy
/dummy does not exist. # 这之后并没有直接退出
Your privileges for the file is:
```
可以看到当文件存在时的输出没有问题，不过在文件不存在时出了一些问题，在输出文件不存在后脚本没有执行exit 1结束，这个问题其实之前鸟哥提到过。我原来写的是：
```bash
test -e $targetFile || echo "$targetFile does not exist" || exit 1
```
该写法在文件存在的时候不会有问题，但是在文件不存在时输出文件不存在后回传码变为1就不会执行exit 1了，应该改写为：
```bash
test ! -e $targetFile && echo "$targetFile does not exist" && exit 1
```
另外我的脚本忘记了对用户的输入是否为空（即直接按下回车），如果用户直接按下回车结果也会出现问题，所以应该在用户输入后加入这一行：
```bash
test -z $targetFile && echo "You must input a correct file path!" && exit 1
```

二、使用判断符号`[]`

我们可以使用中括号省略`test`这个命令名，例如要测试$HOME这个变量是否为空，我们可以使用：
```bash
test -z $HOME; echo $?
[ -z "$HOME" ]; echo $?
```
在使用中括号时，有以下注意点：
* 各元素间务必加上空格
* 中括号内的变量需要用双引号括起来（如果不括起来，且变量中有空格存在时可能会被认为是多个参数）
* 中括号内的常量需要用单引号或双引号括起来

练习题，判断用户输入的是`y/Y`或`n/N`或是非标准的输入：
```bash
#!/bin/bash
# Program:
#	This program determins whether user input y/Y/n/N
# History:
# 2020/11/25 Wallace First Release
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin
export PATH

echo -e "Please input your choice: (y/Y/n/N)"
read choice
[ "$choice" == "y" -o "$choice" == "Y" ] && echo "Your choice is yes." && exit 0
[ "$choice" == "n" -o "$choice" == "N" ] && echo "Your choice is no." && exit 0
echo "Unrecognized choice" && exit 1
```

三、shell script的默认变量

我们举个例子来说明：
```bash
#!/bin/bash
# Program:
#	This program uses the parameters of the script
# History:
# 2020/11/25 Wallace First Release
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin
export PATH

echo "The script name is $0" # 脚本的文件名
echo "Total parameter number is $#" # 调用脚本时后接参数的个数
[ "$#" -lt 2 ] && echo "Total parameter less than 2, exit." && exit 0
echo "Your whole parameter is '$@'" # 全部参数
echo "1st parameter: $1" # 第一个参数
echo "2nd parameter: $2" # 第二个参数
```
执行结果：
```bash
➜  scripts sh sh07.sh one two three
The script name is sh07.sh
Total parameter number is 3
Your whole parameter is 'one two three'
1st parameter: one
2nd parameter: two
```
我们可以在脚本中使用`shift n`来将参数左移n位，左移掉的参数等于“被吃掉了”。

### 使用判断式作为流程控制条件
一、if语句

编程语言中都有最基本的流程控制，shell script也不例外，简单的if-then语句格式为：
```bash
if [ 判断式 ]; then
    COMMANDS
    ...
fi
```
在一个`[]`判断式中我们可以通过-o或-a放入多个判断条件，也可以使用&&或者||连接多个`[]`。除了if-then语句，还有else和elif子句。
```bash
if [ 判断式 ]; then
    COMMANDS
elif [ 判断式 ]; then
    COMMANDS
else
    COMMANDS
fi
```

二、case语句

常规编程语言中我们有switch-case语句，shell script中我们也可以根据变量的不同case选择不同的行为。
```bash
case $变量名 in 
    "case1")
    COMMANDS
    ;;
    "case2")
    COMMANDS
    ;;
    * ) # 相当于其他语言中的default情况
    COMMANDS
    ;;
esac    
```
例子：
```bash
case $1 in
"hello")
	echo "Hello there"
	;;
"")
	echo "You must input parameters. example > {$0 someword}"
	;;
*)
	echo "Incorrect params."
	;;
esac
```

三、while循环

shell script中的while形式有两种：
```bash
# 当条件满足时循环执行动作
while [ CONDITION ]
do
    COMMANDS
done

# 循环执行动作直到条件满足
until [ CONDITION ]
do
    COMMANDS
done
```
练习1：直到用户输入“yes”或“YES”才结束，否则在循环中不断提示用户输入正确的回答
```bash
while [ "$user_input" != "yes" -a "$user_input" != "YES" ]
# until [ "$user_input" == "yes" -o "$user_input" == "YES" ]
do
	read -p "Please input yes/YES to exit:" user_input
	echo $user_input
done	
echo "You have input the correct answer!"
```
练习2：用户输入一个正整数，计算1+2+...+n的结果并输出至屏幕。
```bash
declare -i total=0
declare -i n=0
declare -i i=1
read -p "Enter the max limit:" n
[ $n -lt 1 ] && echo "Not an positive integer!" && exit 1
while [ $i -le $n ]
do
	total=$(( $total + $i ))
	i=$(( $i + 1 ))
done
echo "The result is: $total"
```

四、for循环

shell script中的for循环有两种形式，第一种类似于Python中的循环，或者Java8以后的增强for，需要提供一个变量的取值区间。
```bash
for var in con1 con2 con3 ...
do
    COMMANDS
done
```
后面的condition可以是一连串的字符串，也可以是用cut等命令切出来的一列字符串或是ls列出的一批文件名（只要有空格、Tab、回车分割即可），例如：
```bash
# 例1，cut切割出所有的账户名
users=$(cut -d ':' -f 1 /etc/passwd) 
for username in $users
do
	id $username
	finger $username
done

# 例2，ls列出的所有文件名
dir=/root
for filename in $(ls $dir)
do
    echo "Full path is $dir/$filename"
done

# 例3，seq生成数字序列
network=192.168.0
for host in $(seq 1 255)
do
    echo "The ip addr is ${network}.${host}"
done
```

第二种for循环的形式只适用于整数变量，类似于Java7前的for循环。这种循环可以很方便的使用数值变量作为计数器，例如：
```bash
total=0
limit=100
for ((i=1; i<=$limit; i=i+1))
do
    total=$(($total + $i))
done
echo "Result of 1+2+...+limit is: $total"
```

五、用function定义函数

由于shell script是脚本语言自上而下执行，所以想要使用函数得在前面先声明：
```bash
function myFunc(){
    echo "First param of this function is : $1" # 函数里的$n是调用该函数时后接的参数，而不是脚本的参数。
}
```
定义完毕后在脚本后面就可以将函数名当作一个普通命令一样去调用，并且可以添加若干参数。

### shell script的追踪调试
此外，`sh`命令本身具有一些检查调试相关的选项：
* -n，不执行该script而是仅仅检查其语法问题。
* -v，在执行某脚本前，先将脚本内容输出到屏幕上
* -x，将script每一步的执行过程内容显示到屏幕上

# 第四部分 Linux使用者管理

## 第14章 Linux账号管理与ACL权限设置

### Linux帐号与用户组
在Linux中，`/etc/passwd`和`/etc/group`这两个文件记录了UID、GID与帐号名等信息的对应关系，而记录文件、目录权限信息的inode其实记录的是UID、GID，所以该文件中的内容不可随意修改否则可能引起严重的权限问题。

/etc/passwd每一行用冒号隔开，一共有七个字段，依次为：
1. 账户名
2. 密码，为安全现在统一用`x`代替，现在密码数据改存到/etc/shadow中了
3. UID，特殊的0号表示管理员权限（除了root可以有多个管理员），1~499号保留给系统帐号使用（其中1~99由发行版自动创建，100~499可以给有系统帐号需求的用户使用例如某些高级服务），500~65535是留给一般用户登录用的（我看了CentOS7的/etc/login.defs，系统账号范围是201~999，用户帐号是1000~60000）。
4. GID
5. 用户说明信息，例如finger就会读取显示这段信息
6. 用户的主工作目录$HOME
7. 用户登录后取得的shell（/sbin/nologin是一个特殊的shell，让账户无法取得shell环境）

/etc/shadow同样也是以冒号隔开，有9个字段：
1. 账户名
2. 加密后的密码（只能由密文单向加密得到再比对验证）
3. 最近修改密码的日期（距离1970-1-1的天数）
4. 密码不可以被修改的天数，0表示可以任意更改
5. 密码需要强制更改的天数，超过该天数没有修改则密码过期必须要修改，99999表示没有强制性
6. 密码快到期前的警告天数
7. 密码过期后的宽限天数，该期间内仍可以用过期密码登录，但登录后会强制修改密码
8. 帐号（而非密码）的失效日期，超过该日期无论密码状态如何都不能使用该账号
9. 保留字段

/etc/group文件每行有4个字段：
1. 用户组名称
2. 用户组密码，同样是`x`，很少用到，已经移动到/etc/gshadow中了
3. GID
4. 此用户组下所有的账号名称，用逗号分隔

/etc/gpasswd文件有4个字段：
1. 用户组名称
2. 密码列，如果是`!`表示没有密码，所以没有组管理员
3. 该用户组的管理员帐号
4. 该用户组下所有帐号的名称

一个用户可以加入多个用户组，在/etc/passwd中记录的GID对应的组是`“初始用户组”`，用户登录到系统后立即拥有该用户组的相关权限。在创建新的文件和目录时就会根据当前的`“有效用户组”`确定新文件的所属组，可以使用`groups`命令查看当前用户所属的所有用户组，第一个就是当前有效用户组。进一步可以通过`newgrp groupname`来切换用户当前的有效用户组（注意该命令实际上会切换到一个新的shell下，环境设置保留但用户组权限会重新计算）。

### 账号管理
一、新增与删除用户useradd/passwd/usermod/userdel

管理员使用useradd来新建一个用户，其格式为`useradd [-u UID] [-g 初始用户组] [-G 次要用户组] [-m|M] [-c 账户说明] [-d 指定主目录的绝对路径] [-s shell] 用户名`，参数说明：
* -M，强制不创建主目录（系统账号默认）
* -m，强制创建主目录（用户帐号默认）
* -r，创建一个系统帐号，UID会受`/etc/login.defs`的限制
* -e，后接一个日期“YYYY-MM-DD”，表示帐号过期的日期
* -f，指定帐号过期后的宽限天数，0表示不宽限，-1表示禁用过期功能

创建新用户时如果没有指定某些参数，那么默认会按照`/etc/default/useradd`这个文件中的内容来设置，这个文件的内容也可以用`useradd -D`来查看。创建用户主目录时，会以`/etc/skel`目录下的内容作为模板（这一点就定义在前者的内容SKEL中）。

创建新用户之后由于没有设置密码该账户是无法登录的，需要使用`passwd`命令来修改密码。所有用户均可以通过该命令修改自身的密码，root可以在命令后加上要修改密码的用户名来修改该用户的密码。常用的选项有：
* -S，显示/etc/shadow的大多数字段（使用`chage -d USERNAME`可以看到详细描述）
* -l，Lock锁定用户不能登录（本质是修改/etc/shadow）
* -u，unlock解锁
* -n，（min）后接多少天内不可修改密码
* -x，（max）后接多少天后必须修改密码
* -w，（warning）后接过期前的警告天数
* -i，（inactive）过期后的宽限天数
* --stdin，使用标准输入流中的数据作为密码，并且无需二次确认

一般用户设置密码时会有一些限制如不能和用户名相同、不能过于简单等，这些规则一般受到pam模块管理，不同distribution的/etc/pam.d这个目录下有着对应的内容。

创建用户后如果有需要还可以通过`usermod`来微调用户的部分信息，其大多数选项都和useradd的相同；使用`userdel`可以删除用户账户（会从上面提到的四个文件中删除对应的行），使用`-r`选项可以连同该用户的主目录一起删除。

二、用户功能

`finger`命令可以查看指定用户的信息（指纹）；`chfn`可以修改用户的指纹信息；`chsh`的-s选项可以更改当前用户的shell；`id`可以查看一些uid、gid有关的信息。

三、新增与删除用户组

同样地，可以使用`groupadd`、`groupmod`和`groupdel`来创建和删除用户组，使用`gpasswd`可以设置、删除组密码或组管理员、增加组成员。

### 具体权限规划：ACL
ACL的全称是Access Control List，可以针对单一用户、单一文件或目录来进行权限设置，但启用ACL需要特定文件系统的支持。ext2、JFS、XFS以上一般都支持。我们通过`setfacl`和`getfacl`来设置和查看ACL权限。

setfacl的格式为`setfacl [-bkRd] [{-m|-x} ACL参数] 文件名`常用的选项有：
* -m，后接要设置的ACL参数
* -x，后接要删除的ACL参数
* -b，删除所有的ACL参数
* -k，删除默认的ACL参数
* -R，递归设置子目录
* -d，设置默认ACL参数，只对目录有效

示例：
```bash
# 通常的需求是单独针对某文件设置某用户的权限
setfacl -m u:wallace:rx testFile
# 也可以单独针对某文件设置用户组的权限
setfacl -m g:workgroup:rx testFile
# 使得设置完之后在目录下新建的文件也能继承ACL权限（使用-R只能递归设置已有的文件）
setfacl -m d:u:wallace:rx /tmp/workFolder
```

### 用户身份切换
通常情况下我们应尽量使用一般身份用户来进行日常作业，只有在需要设置系统环境时才切换到root身份，这样可以尽量避免误操作带来的麻烦；另外有时我们必须要使用系统帐号来执行某些软件，但是以root身份运行权限过高，这时我们可以单独创建一个系统用户来启动软件，如果程序被攻破，系统不至于损坏；还有一些软件本身就不允许用root身份执行，如chrome。

一、`su`，单纯使用su可以切换到root身份，但使用的是non-login shell方式，环境变量仍然是原用户的，使用`su -`可以以login shell的方式切换到root，`su - -c "COMMAND"`可以一次性切换到root来执行COMMAND，执行完毕后回到原来的身份。

示例：
```bash
# 一次性切换到wallace的身份并创建某个目录
su - wallace -c "mkdir -p /tmp/testdir"
sudo -u wallace mkdir -p /tmp/testdir # 作用相同
# 切换到wallace并一次性执行多个COMMAND
sudo -u wallace sh -c "COMMAND;COMMAND;..."
```

二、`sudo`，为了避免root密码泄露，在/etc/sudoers中配置过的用户可以执行sudo并使用自己的密码来以root权限执行任务，我们可以直接用vim修改该文件或用visudo命令（其实还是调用vi）来修改：
```bash
# 用户  来源主机=（可切换的身份） 可执行的命令
root	ALL=(ALL) 	ALL
# 加上百分号表示后面是一个用户组
%wheel	ALL=(ALL)	ALL
# 让用户无需输入自己的密码也可以执行sudo
%wheel	ALL=(ALL)	NOPASSWD: ALL
# 让指定用户可以修改他人密码，但不能修改root密码
wallace ALL=(root)  !/usr/bin/passwd, /usr/bin/passwd [A-Za-z]*, !/usr/bin/passwd root
```
此外可以为多个用户或多个COMMAND设置别名，来统一设置多个用户的权限。

### Linux主机上的用户信息传递
一、查询用户已经登录在系统上的用户可以使用`w`或`who`，想要知道每个账户最近登录的时间可以使用`lastlog`，想要知道最近一段时间内的主机登录记录可以使用`last`命令。

二、在使用`who`后能看到正在使用主机的其他用户极其端口（如pts/1），那么使用`write username pts/1`就可以输入要发送给他的信息，使用Ctrl+d结束输入后对方就可收到信息。每个用户可以使用`mesg n/y`来选择关闭或开启消息接收。另外，使用`wall "message"`可以向全体用户广播信息。

三、可以使用`mail username@host`来给用户写邮件，直接使用`mail`则是直接进入邮件程序，不过现在该程序使用得非常少了。

****
## 第15章 磁盘配额与高级文件系统管理
**暂时略过**
****

## 第16章 例行性工作
Linux下有两种工作调度方式，一种是突发性的（at，需要atd服务），一种是例行性的（crontab，需要crond服务）。

### 仅执行一次的工作调度at
/etc/at.deny和/etc/at.allow（更严格，优先级更高，一般只用前者）分别可以存储执行at命令的账户的黑名单和白名单。

at的使用格式为`at [-mldv] TIME`，TIME是指定的时间，按下回车后可以进入at shell输入要执行的多条命令，使用Ctrl+d结束输入；此外还可以使用`at -c 1/2/...`查看已经规划好的第n个计划任务。
* -m，（at中执行的stdin/out和终端机环境无关，如果不手动指定输出到终端设备如/dev/tty1的话就会输出到用户的邮箱，计划任务中没有输出则不会发送）使用该选项可以在没有输出信息时仍然发邮件通知用户任务已经完成。
* -l，列出目前系统上该用户的所有at任务。等同于`atq`命令。
* -d，取消一个at中计划的任务。等同于`atrm`命令。
* -v，使用较明显的时间格式显示计划任务列表。
* TIME的格式：
    1. 04：00
    2. 04：00 2020-12-09
    3. 04：00pm March 17
    4. [HH:MM[am|pm]|now] + n [minutes|hours|days|weeks]

另外，如果执行at命令时的工作目录是working directory，那么时间到之后at执行任务的工作目录也是该目录，和用户是否还在该目录、用户是否通过终端机登录到系统都没有关系。因为系统会将该项at工作独立出当前用户的shell环境中，并交给atd程序来接管。

如果想要在CPU负载低的时候（单一时间内负责的工作数量）才执行计划任务可以使用`batch TIME`来规划，其底层还是调用了at，所以可以用at查看、取消这些任务。

### 周期性工作调度crontab
cron的名字来自于希腊语chronos，意思是时间。

/etc/cron.deny和/etc/cron.allow（更严格，优先级更高，一般只用前者）分别可以存储执行crontab命令的账户的黑名单和白名单。在各用户使用crontab这个命令来新建任务调度后，任务调度会被记录到/var/spool/cron/$USERNAME中（尽量不要直接编辑该文件），并且cron每一项工作的日志都会记录到/var/log/cron中。

该命令的语法为`crontab [-u username] [-l|-e|-r]`，选项为：
* -u，仅仅root可以使用此选项为其他用户创建计划任务
* -e，编辑crontab的工作内容
* -l，查询crontab的工作内容
* -r，删除所有的crontab工作内容

使用-e的话会调用vi编辑上面提到的文件，其实就是cron "tab"le嘛，表格的格式为：
|分|时|日|月|周几|命令串|
|---|---|---|---|---|:-:|
|20|12|*|*|*|mail wallace -s "at 12:00" < /home/wallace/.zshrc|

上面表格中使用星号表示任意日/月/周只要是12时都执行命令；在同一列中可以用逗号分隔多个满足条件的时间点；可以用减号连接表示一个时间段内所有的整时间点（例如20 8-10表示8:20、9:20、10:20这三个时间点都要执行）；可以用/n表示每n个间隔单位就进行一次（*/5和0-59/5意思相同）。

### 系统的配置文件/etc/crontab
一般用户的例行任务被记录在/var/spool/cron/$USERNAME中，而系统级别的任务则记录在/etc/crontab中，相比前者多了几条记录以及要以什么用户的身份执行：
```sh
SHELL=/bin/bash
PATH=/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=root

# For details see man 4 crontabs

# Example of job definition:
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
# |  |  |  |  |
# *  *  *  *  * user-name  command to be executed
```
`run-parts`是一个存放于/bin下的可执行脚本，后接一个目录，作用是运行该目录下所有的脚本。在任务规划时可以使用该命令批量运行写好的脚本。

### 可唤醒停机期间的工作任务
在不是7*24运行的主机环境下，anacron会检测停机期间应该进行但是没有进行的crontab任务，将他们执行一遍，然后anacron就自动停止了。anacron会以一天、一周、一个月为期去检测系统未进行的croontab任务。

anacron的运行时间点通常有两个：一是在开机期间运行，二是写入crontab的调度中来在特定时间分析系统未进行的工作。其语法为`anacron [-sfn] JOB ...`，常用的参数为：
* -s，start开始连续执行各项工作
* -f，force强制执行而不会去判断时间记录文件
* -n，now立刻进行未进行的任务，而不延迟等待时间
* -u，仅更新时间记录文件的时间戳，不进行任何工作。

## 第17章 程序管理与SELinux初探
程序与进程的概念是老面试基础题了，程序一般是放置在磁盘中，通过用户执行来触发，当触发后加载到内存中就成了进程，进程会拥有使用者的权限（例如/bin/bash），进程衍生出的其他进程（子进程）一般情况下也会沿用父进程的相关权限。

在Linux中过程调用通常称为fork-and-exec，父进程先通过fork复制的方式产生一个除了pid和ppid以外都一样的子进程（copy on write的思想，加快创建进程的速度），子进程再以exec的方式执行实际要进行的进程。

常驻内存中的进程称为服务（daemon），例如crond、syslogd等。还有一些负责网络联机的服务如apache、named等，它们在被执行后会监听一个网络端口。

Linux开机后会提供6个tty终端机进程（tele-typewriter）和1个图形界面，可以使用Ctrl+Alt+F1~F7来切换（不同的distrobution可能有差异）。当出现程序错误导致死机时，可以切换到其它tty进程杀死问题程序就回复正常了。在bash中我们执行命令时也可以在最后加上一个`&`表示放置与后台执行。

### bash下的工作管理 job control
这里工作管理的概念仅涉及每个单独的bash，即管理的是目前shell的子进程，我们无法由tty1的环境去管理tty2的bash及其子进程。几个注意点：
* bash的job control所触发的进程必须来自于当前shell的子进程
* 你可以控制和执行命令的环境成为前台foregroud
* 后台指的是进程可以自行运行而不需要用户干预（不能等待用户的输入），无法用Ctrl+c来终止。

一、将命令直接丢到后台执行：`&`

我们可以在shell中输入命令后再加一个`&`表示要让该进程后台执行，这时bash会给予该命令一个工作号码job number，假设为n，那我们可以通过`fg %n`来将该命令调到前台。在后台运行的进程的stdout和stderr仍然会输出到前台，有可能干扰到用户当前的工作，所以如果不想看到输出那么可以利用数据流重定向到文件。

二、将目前的工作丢到后台中暂停：`Ctrl + z`

这里没有太多可说的，再使用`jobs`可以查看后台工作状态：
* -l，同时列出pid
* -r，仅列出running的工作
* -s，仅列出suspended的工作

三、将后台工作拿到前台来处理`fg`

直接执行fg会取出jobs的输出中带有+号的任务，即最后一个被放到后台的任务。我们可以使用`fg %n`取出第n号任务到前台运行，使用`fg %-`表示会取出jobs的输出中带有-号的任务。

四、将后台下的工作状态变为运行：`bg`

类似于fg，bg也可以指定任务号来让某个任务在后台变为运行状态。

五、🚩管理后台的工作：`kill`

kill的用法为`kill -signal %jobnumber`，kill常用的选项有
* -l，列出当前kill能使用的信号
* -1，发送信号1（-SIGHUP），这个信号的默认操作为终止进程，因此前台进程组和后台有终端输出的进程就会中止。 此外，对于与终端脱离关系的守护进程，这个信号用于通知它重新读取配置文件。
* -2，发送信号2（-SIGINT），Ctrl+c也是发送了这个信号，表示中断，如何响应中断由程序决定，通常是退出程序。
* -9，发送信号9（-SIGKILL），强力杀死该进程。
* -15，发送信号15（-SIGTERM），以常规流程结束进程。

其实kill的功能不仅限于管理当前shell的jobs，更是可以管理进程process，上面的格式中如果不加%则后面的数字就是进程的pid。

六、脱机管理

在从当前bash注销后，在后台运行的进程都会被中断掉。想要让注销后任务一直运行有两种方式：
1. 使用at将工作托管给atd服务。
2. 使用`nohup COMMAND &`来继续执行COMMAND，不过nohup并不支持bash的内置命令。

### 进程管理
常见问题：发现系统资源要被使用光，需要找出最耗费系统资源的进程并删除之；或者需要找出运行异常的进程；抑或是想要让某项进程最优先被执行。这些问题都需要我们熟悉进程的管理流程。

一、进程的查看

进程查看有两种方式，静态的ps（processes snapshot）和动态的top。

关于ps，手册比较复杂，鸟哥推荐两个常用的用法：查看当前shell有关的所有进程`ps -l`和查看所有系统运行的程序`ps -aux`（其实这样记忆不太合适）。
```sh
➜  ~ ps -l             
F S   UID   PID  PPID  C PRI  NI ADDR SZ WCHAN  TTY          TIME CMD
4 S     0  3709  3598  0  80   0 - 58090 do_wai pts/0    00:00:00 su
4 S     0  3718  3709  0  80   0 - 38168 sigsus pts/0    00:00:06 zsh
0 R     0  8974  3718  0  80   0 - 38331 -      pts/0    00:00:00 ps
➜  ~ ps -aux | head -n 3 
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.3 194172  7324 ?        Ss   16:08   0:03 /usr/lib/systemd/systemd --switched-root --system --deserialize 22
root         2  0.0  0.0      0     0 ?        S    16:08   0:00 [kthreadd]
```
常用的选项有：
* -A/-e，将所有的进程显示出来而不仅仅是当前terminal有关的进程
* -a，不与terminal有关的所有进程
* -u，有效用户的相关进程
* -f，做一个更完整的输出

如果要找进程之间的相关性，`pstree`很好用，用法为`pstree [-A|-U] [-up]`，选项：
* -A，进程树间用ASCII字符连接
* -U，进程树间用UTF-8字符连接，某些不兼容的终端下可能出现错误
* -p，同时列出进程的pid
* -u，同时列出进程所属帐号的名称。