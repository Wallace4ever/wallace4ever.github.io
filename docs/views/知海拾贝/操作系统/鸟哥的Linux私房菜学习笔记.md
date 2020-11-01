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

使用umask [-S]可以查看或修改，它指的是创建文件或目录时u/g/o要拿掉的权限，文件的默认权限是666，目录的默认权限是777。，root用户的umask为022，表示对于user不拿掉任何权限，对于group和others拿掉写权限。一般身份用户的umask通常为002，即保留用户组的写入权力。

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
    ➜  ~ llll -i /etc/crontab ./crontab         
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