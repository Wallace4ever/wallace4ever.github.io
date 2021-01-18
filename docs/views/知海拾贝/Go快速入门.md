---
title: Go语言快速入门
date: 2021-01-13
tags:
 - Golang
categories:
 - 知海拾贝
---

:::tip
Go（又称Golang）是Google开发的一种静态强类型、编译型、并发型，并具有垃圾回收功能的编程语言，被称为云计算时代的C语言，让我们来快速入门Go吧。
:::
<!-- more -->

Go语言最大的优势是在于其语言层面就支持并发，而不像Java那样需要导入JUC包，这样其开发效率和运行效率都有优势，并且使用Go编译的程序的运行速度可以媲美C或C++的速度，同时更加安全。

Go语言的优势：
* 可以直接编译成机器码，运行时不依赖其他库（dll/so），部署就是放一个可执行文件到服务器就可以了。（不代表可以跨平台）
* Go是静态类型语言，在编译时就能检查出大多数问题，但是有动态语言的感觉。
* 语言层面支持并发，可以充分利用多核。
* 内置runtime，支持垃圾回收。
* 简单易学，有C语言的基因。
* 内置有丰富的标准库，特别是网络库非常强大。
* 内置强大的工具，例如gofmt工具可以格式化代码，方便团队review。
* 跨平台编译，如果代码中不包含cgo就可以做到在Windows系统下编译Linux应用
* 内嵌C语言支持，可以直接包含C代码。

Go语言的使用场景：
* 服务器编程，例如处理日志、数据打包、虚拟机处理、文件系统等。
* 分布式系统、数据库代理服务器等。
* 网络编程，包括Web应用、API应用、下载应用。
* 内存数据库。
* 云平台。

一些基本的语法规则：
* go语言以包作为管理单位，每个文件必须先声明包。
* 运行程序的入口是main包的main函数，一个工程只能有一个main函数。
* 语句结尾没有封号，除非要将多个语句写在一行。
* 导入的包必须要使用，变量声明了也必须要使用。

## 第一章 基本类型、流程控制
### 01 常量和变量
Go语言中常量和变量的命名规范和很多语言类似，名字可以有字母、下划线、数字组成，不能以数字开头、不能是关键字、区分大小写。

**声明变量的格式**为`var 变量名1, 变量名2, ... 类型`，例如：
```go
package main

import "fmt"

func main(){
    var a int //声明但没有初始化，默认初始化为0
    var b int = 10 //初始化
    fmt.Println("a = ", a)
    a = 5 //赋值
    fmt.Println("a = ", a)
}
```
如果变量在声明时就进行初始化，那么可以省略类型，让编译器自动推导类型：
```go
func main()  {
    //var b = 20.0
	b := 20.0
	fmt.Printf("The type of b is %T\n", b) //The type of b is float64
}
```
Go还支持多重赋值：
```go
func main()  {
	a, b := 10, 20 //多重赋值
	a, b = b, a //交换2个变量的值不需要temp变量，类似于python
}
```
**匿名变量`_`**，类似于/dev/null黑洞设备，会丢弃被赋的值而不处理，搭配Go语言的返回值使用有优势。Go语言的函数可以返回多个值（谢天谢地不用像Java那样想要返回多个数据时得做一层封装了）：
```go
func test() (a, b, c int){
	return 1, 2, 3
}

func main(){
	var c, d, e int
	c, d, e = test() //这三个变量会一次被赋值为1，2，3
	var f int //如果我只想取用第二个返回值并赋值给f，那么就可以：
	_, f, _ = test()
	//使用这些变量……
}
```

变量声明使用`var`关键字，常量声明则使用`const`关键字，常量赋值时自然也可以自动推导类型，但不能使用`:=`，只能用`const 常量名 = 常量值`。常量必须要在声明时就赋值。

**多个变量或变量（可以是不同类型）的声明**：在Java中，我们一次只能为同类型的多个变量或常量赋值，例如`int a = 1, b = 2; float c = 3.1f; double d = 4.6d;`，但在Go中我们可以同时声明不同类型的变量或常量：
```go
func main() {
	var (
		a int //在这里初始化也可以
		b int
		c float32
		d float64
	)
	a, b, c, d = 1, 2, 3.1, 4.6
	fmt.Println(a, b, c, d)

	const (
		i = 10 //这里让编译器来自动推导类型
		j = 12.1
		k //这里比较特殊看起来没有赋值，实际值和上一行一样也是12.1
	)
	fmt.Println(i, j, k)
}
```

**iota常量枚举**：在代码中每隔一行使用自动累加1，可以用于枚举：
```go
func main() {
	const (
		a = iota //0
		b = iota //1
		c = iota //2
	)

	//iota每次遇到const就会重置为0
	const d = iota //0

	//可以只写一次
	const (
		e = iota //0
		f //1
		g //2
	)

	//如果在同一行则值一样
	const (
		h = iota //0
		i, j, k = iota, iota, iota //都为1
		l = iota //2
	)
}
```

### 02 基本数据类型
Go语言内置以下基本数据类型：
|类型|名称|长度（字节数）|零值|说明|
|:--|:--|:-:|:--|:--|
|bool|布尔类型|1|false|不可以用数字代表true或false|
|byte|字节型|1|0|uint8别名，可以用于存储ACSII码|
|rune|字符型|4|0|专用于存储单个Unicode字符编码，等价于uint32|
|int，uint|整形|4或8|0|32为或64位可变|
|int8，uint8|整形|1|0|8位整形或无符号整形，占1字节，-128~127或0~255|
|int16，uint16|整形|2|0|16位整形或无符号整形，-32768~32767或0~65535|
|int32，uint32|整形|4|0|同理，-2147483648~2147483648或0~4294967295|
|int64，uint64|整形|8|0|同理|
|float32|浮点型|4|0.0|小数位精确到7位|
|float64|浮点型|8|0.0|小数位精确到15位|
|complex64|复数类型|8|||
|complex128|复数类型|16|||
|uintptr|整形|4或8||足以存储指针的uint32或uint64整数|
|string|字符串||空串""|utf-8字符串|

一些示例：
```go
func main(){
	//1. byte/rune类型的数据和整数的运算
	var ch1 byte
	ch1 = 97
	fmt.Printf("%c, %d\n", ch, ch) //使用格式控制，打印结果是a和97
	ch1 = 'A' //这里只能是ASCII字符，如果是Unicode字符编译时汇报溢出byte类型
	fmt.Printf("大写转小写结果：%c\n", ch + 32)
	fmt.Printf("d的大写形式：%c\n", 'd' - 32)

	var ch2 rune = '中'
	fmt.Printf("中的下一个编码字符是：%c\n", ch2)

	//2. string类型，内建函数len()可以测字符串长度，字符串末尾隐藏了一个结束符'\0'
	str := "This is content."
	fmt.Println("str的字符长度是：", len(str))
	fmt.Println("str[0]:", str[0], "str[1]:", str[1]) //这样打印出来是ASCII码整数
	fmt.Printf("str[0]: %c str[1]: %c\n", str[0], str[1]) //使用格式控制来打印出单个字符

	//3. 复数类型，内建函数real()和imag()可以用于取出实部和虚部
	var c1 complex128 = 2.1 + 3.14i
	fmt.Println("实部：", real(c1), "虚部：", imag(c1))
}
```

### 03 fmt包的格式化输入输出
Printf()函数的格式化字符有很多，一部分和c语言相通，常用的有：
* %c，字符型，可以把合法的整数按照Unicode码表转换成字符输出
* %d，十进制整形
* %o，八进制整形
* %f，浮点数
* %e/%E，科学计数法表示的浮点数
* %x/%X，十六进制整数
* %s，字符串，输出字符串的字符直到空字符'\0'为止
* %T，Go语言中的数据类型
* %v，使用默认格式输出

读取用户输入：
```go
func main() {
	var a int
	fmt.Println("请输入一个整数：")
	//这里会阻塞，等待用户输入
	fmt.Scanf("%d", &a) //类似于c语言，读取格式化输入数据后存放到a的地址处
	//也可以不指定输入格式
	fmt.Scan(&a)
}
```

### 04 类型转换和别名
Go语言不允许隐式的转换，必须显式声明，另外两种类型必须兼容（例如byte/rune和整形兼容，bool类型和整形不兼容不能互相转换），例如：
```go
var ch byte = 97
var a int = int(ch)
```
类型别名：我们可以使用`type`关键字给已有的类型起别名，例如要给int64类型起别名为bigint：
```go
func main() {
	type long int64
	var b long
	fmt.Printf("Type of b : %T", b) //Type of b : main.long
}
```

### 05 运算符
Go语言的算术运算符和大多数语言相同：`+-*/%`，但注意Go语言中自增自减运算符`++`和`--`只能后置不能前置。

Go语言的关系运算符的写法也和大多数语言相同：大于`>`、小于`<`、等于`==`、大于等于`>=`、小于等于`<=`，不等于`!=`。

Go语言的逻辑运算符也和大多数语言相同：与`&&`、或`||`以及非`!`。

Go语言的位运算符包括：按位与`&`、按位或`|`、按位异或`^`、左移`<<`以及右移`>>`。

Go语言和C语言类似还有取地址运算符`&`和取值运算符`*`，两者分别对变量和指针变量有效，例如`&a`表示取变量a的地址、`*a`表示取指针变量a所指向的内存中存放的值。

### 06 流程控制
Go语言和大多数语言一样支持顺序结构、选择结构和循环结构。

选择结构：
```go
// if 选择
func testIf() {
	s := 92
	if s >= 80 { //Go的判断条件不需要加括号
		fmt.Println("成绩优秀")
	}

	//if支持写入一个初始化语句，初始化语句和判断条件用分号分隔
	if t := 75; t >= 80 {
		fmt.Println("成绩优秀")
	} else if t >= 60 {
		fmt.Println("成绩不佳")
	} else{
		fmt.Println("不及格")
	}
}

// switch 选择
func testSwitch() {
	sex := '男'
	switch sex { //同样地，sex也不用加括号
		case '男':
			fmt.Println("左转")
			break //Go保留了break关键字，但switch语句中每个case结束默认break所以不用写
		case '女':
			fmt.Println("右转")
			fallthrough //如果使用了该关键字并能被执行到这里，下面的所有case都会无条件执行
		default :
			fmt.Println("起飞")
	}

	//类似地，可以把一条初始化语句放到switch中
	switch age := 24; age {
		case 10, 20:
			//some actions
		//...
	}

	//switch也可以没有目标变量，这时要在case中放条件
	score := 81
	switch {
		case score >= 80:
			fmt.Println("成绩优秀")
		case score >=60:
			fmt.Println("成绩良好")
		default:
			fmt.Println("不及格")
	}
}
```

循环结构：Go语言中没有while或者do...while关键字，只有for循环和range迭代器：
```go
//一般的for循环
func testFor() {
	sum := 0
	for i := 1; i <= 100; i++{ //同样不需要括号
		sum += i
	}
	fmt.Println("sum = ", sum)

	str := "abc"
	for i := 0; i < len(str); i++ {
		fmt.Printf("str[%d] is %c\n", i, str[i])
	}
}

//range默认返回两个值：元素的位置和元素本身
func testRange() {
	str := "abc"
	for i, data := range str { //如果不需要第二个返回值可以写为i := 或者i, _ :=
		fmt.Printf("str[%d] is %c\n", i, data)
	}
}
```

在Go中，`break`关键字可以用于for、switch和select，而continue只能用于for循环。
```go
func testBreak() {
	i := 0
	for { //可以按照需要省略初始条件、终止条件和动作，如果都省略那么两个封号也可以省略（死循环）
		i++
		if i == 5 {
			break 
		}
		fmt.Println("i = ", i)
	}
}
```
Go语言保留了`goto`关键字，但是尽量不要使用，频繁使用goto跳转会让代码逻辑看起来很混乱。goto可以用在任何地方，但是不能跨函数跳转。用户定义的标签（label）定义了就一定要使用否则编译不通过。
```go
func testGoto() {
	fmt.Println("Step 1")
	goto MyLabel
	fmt.Println("Step 2")
MyLabel: //
	fmt.Println("Step 3")
}
```

## 第二章 函数、工程管理
Go语言的函数名称首字母小写则为private、大写则为public，定义格式如下：
```go
func FuncName(/*参数列表*/) (o1, o2 type1, o3 type2 /*返回类型*/) {
	//函数体

	return v1, v2, v3 //返回多个值
} 
```

### 01 自定义函数
定义无参数、无返回值的函数：
```go
func MyFunc() {
	fmt.Println("This is a test function.")
}
```

定义有普通参数、无返回值的函数：
```go
//这里的abc称为形参
func MyFunc(a, b int, c string /*这里不需要var关键字*/) {
	fmt.Printf("a = %d, b = %d, c is %s\n", a, b, c)
}

func main() {
	//传递的是实参
	MyFunc(233, 2333, "cool")
}
```

定义有不定参数（指参数的个数不确定）、无返回值的函数：
```go
//不定参数（类似于Java中本质上是数组的可变参数），其本质是切片
//和Java一样，不定参数可以和普通参数一起使用，但只能放在形参列表的最后
func MyFunc(args ... int) {
	fmt.Println("len(args) = ", len(args))
	for i := 0; i < len(args); i++ {
		fmt.Printf("args[%d] = %d\n", i, args[i])
	}

	for i, value := range args {
		fmt.Printf("args[%d] = %d\n", i, value)
	}
}
```

在不同多个函数之间传递不定参数：
```go
func MiddleFunc(args ... int) {
	//调用上面的函数，把全部元素传递过去
	MyFunc(args...)
	//假设不定参数有4个，我只想把后2个（第2、3个）参数传递出去
	MyFunc(args[2:]...) //从args[2]开始到结束，左闭右开，类似于Python的切片写法
}
```

定义无参数、有一个返回值的函数：
```go
//只有1个返回值
func MyFunc1() int { //只有1个返回值可以省略第二个括号
	//some codes
	return 666
}

//给返回值起一个变量名，Go推荐写法
func MyFunc2() (result int) {
	result = 777
	return //这里直接return，因为知道要返回result的值，当然直接写return 777也可以
}
```

定义无参数、有多个返回值的函数：
```go
func MyFunc3() (int, int, int) {
	return 1, 2, 3
}

//推荐写法，为返回值起名
func MyFunc3() (a, b, c int) {
	a, b, c = 1, 2, 3
	return
}
```

### 02 递归函数
### 03 函数类型
### 04 匿名函数与闭包
### 05 延迟调用defer
### 06 获取命令行参数
### 07 作用域
### 08 工程管理

## 第三章 复合类型
### 01 指针
### 02 数组
### 03 slice
### 04 map
### 05 结构体

## 第四章 实现面向对象特性
### 01 匿名组合（继承）
### 02 方法（封装）
### 03 接口（多态）

## 第五章 异常、文本文件处理
### 01 error接口、panic、recover
### 02 字符串处理
### 03 正则表达式
### 04 JSON处理
### 05 文件操作

## 第六章 并发编程
### 01 概述
### 02 goroutine
### 03 channel
### 04 select

## 第七章 网络概述、socket编程
### 01 网络概述
### 02 Socket编程
### 03 案例：并发的聊天室服务器

## 第八章 HTTP编程
### 01 Web工作方式
### 02 HTTP报文格式
### 03 HTTP编程
### 04 案例：网络爬虫