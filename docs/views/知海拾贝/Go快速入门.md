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
递归函数没什么特别的，注意递归终止条件即可。
```go
//示例1：打印1到正整数n
func main() {
	test(4)
}

func test(a int) {
	if a <= 0 {
		return
	}
	test(a - 1)
	fmt.Println("a = ", a)
}

//示例2：求1+2+...+n
func main() {
	fmt.Println("result = ", add(4))
}

func add(n int) int {
	if n <= 0 
		return 0
	return n + add(n -1)
}
```

### 03 函数类型
在Go语言中，函数也是一种数据类型，同样可以使用`type`关键字来定义。它的类型就是拥有相同参数、相同返回值的一种类型。使用自定义的函数类型我们可以实现多态与函数回调。
```go
package main

import "fmt"

//例如我可以定义一种整数二则运算的类型
type FuncType func(int, int) int

func main() {
	var (
		operand1, operand2 int
		f FuncType
	)

	operand1, operand2 = 5, 3
	f = MyMod //f可以是任何满足FuncType定义的函数，这就是一种多态的体现
	
	//当然直接写result := f(operand1, operand2)也可以，那就体现不出回调了
	result := InvokeCalculation(operand1, operand2, f) 
	fmt.Println("result =", result)
}

//调用时只关心f是一个FuncType类型的函数，可以处理两个整形操作数并返回一个整形值
func InvokeCalculation(o1, o2 int, f FuncType) int {
	fmt.Println("Invoking function f...")
	return f(o1, o2)
}

func MyAdd(o1, o2 int) int {
	return o1 + o2
}

func MyMod(o1, o2 int) int {
	return o1 % o2
}
```
通过使用函数类型，我们可以将函数作为另一个函数的参数，从而实现函数的回调（正如上面的InvokeCalculation函数）。使用回调极大地提升了函数的可扩展性。

:::tip
作为对比，Java中实现方法的回调需要用到的参数是类或接口的实例，通过instance.method(operand)来实现回调。
:::

### 04 匿名函数与闭包
所谓闭包就是一个函数“捕获”了和它在同一作用域的其他变量常量。这就意味着无论在什么地方当闭包被调用的时候，闭包都能使用这些变量常量。它不关心这些量是否已经超出了作用域，只要闭包还在使用他们，他们就还会存在。

在Go中，闭包是通过匿名函数来实现的。（正如同Java中内部类可以访问外部类的成员变量或外部方法的局部变量，匿名内部类可以访问外部方法用final修饰的局部变量）

```go
//其中的匿名函数和外部函数形成了闭包
func main() {
	a := 10
	b := 20
	str := "mike"

	//匿名函数，没有名字，只是定义还没有调用
	f1 := func() { //这里通过自动推导给匿名函数命了名
		fmt.Println("a = ", a)
		fmt.Println("str = ", str)
	}
	f1() //调用

	//写法2：定义并同时调用
	func() {
		fmt.Printf("a = %d, str = %s\n", a, str)
	}() //这个括号表示给该函数传参，不过我们定义的函数没有参数所以括号内没有内容

	//例3：定义有参数有返回值的匿名函数并同时调用
	x, y := func(i, j int) (max, min int){
		if i > j {
			max = i
			min = j
		}else {
			max = j
			min = i
		}
		return
	}(a, b)
	fmt.Println(x, " ", y)
}
```

Go语言中闭包是以**引用**的方式捕获外部变量，在匿名函数中修改外部变量后，外部函数中看到的变量是修改后的。（不像Java中final关键字从设计上让匿名内部类看到的只是外部变量的**拷贝**）
```go
//返回值为一个匿名函数，该函数没有参数，返回值为int类型
func squares() func() int {
	var x int //没有初始化，值为0
	return func() int {
		x++
		return x * x
	}
}

func main() {
	//用变量f接收这个匿名函数/闭包函数
	f := squares()
	fmt.Println(f()) //1，首次调用后x=1，并且return后依然存在（普通函数调用后变量就被回收了）
	fmt.Println(f()) //4
	fmt.Println(f()) //9

	f = squares() //再次生成x并返回新的匿名函数，这时重复执行打印会得到1，4，9，16，...
}
```
上面的例子说明，闭包使用的外部变量的生命周期不由它的作用域决定。对squares()的一次调用会生成一个局部变量x并返回一个匿名函数，之后变量x仍然隐式存在于f中。

### 05 延迟调用defer
Go中的defer类似于C++中的析构函数，用于在调用结束前做一些收尾清理的工作，例如关闭文件、网络连接等。defer语句只能放在函数的内部，但不要求放在源代码的结尾。
```go
func main() {
	defer fmt.Println("closing...") //这一句会在最后执行
	fmt.Println("working...")
}
```
如果有多个defer语句，在源代码中先写的后被执行（LIFO）。如果某行普通语句在运行时发生错误，在其之前的defer语句依旧会被执行（之后的defer语句不会）。如果某个延迟调用语句在运行时发生错误，其余的调用依旧会被执行。

延迟执行类似于在从上往下执行代码时，遇到defer就把该语句放入某个栈中，当程序运行结束或遇到异常退出时，会把已经在栈中的语句取出执行（所以错误之后的defer语句不会执行）。

defer和匿名函数结合使用：
```go
func main() {
	a := 10
	b := 20
	
	defer func(){ //由于是延迟执行，所以调用匿名函数时捕获到的a、b已经是修改后的值
		fmt.Printf("a = %d, b = %d\n", a, b)
	}()

	defer func(x, y int){ //如果这里把匿名函数的形参写成(a, b int)那么下一行打印的就是形参而非外部的a和b
		fmt.Printf("a = %d, b = %d\n", a, b) //外部的a和b
		fmt.Printf("参数x = %d, y = %d\n", x, y) //传进来的参数的值
	}(a, b) //注意在延迟执行时，已经传递的参数是当时未修改的a和b的值

	a = 111
	b = 222
	fmt.Printf("a = %d, b = %d\n", a, b)
}
```

### 06 获取命令行参数
要获取用户从命令行传递的参数，需要导入`os`这个包：
```go
import (
	"fmt"
	"os"
)

func main() {
	list := os.Args
	n := len(list)
	fmt.Println("参数个数：", n)
}
```
我们使用go build命令编译得到可执行文件如program，那么在命令行下执行`program arg1 arg2`，程序名本身也是一个参数，所以一共有三个参数。

os.Args本质是`var Args []string`，所以可以通过for迭代遍历（list[i]/range）。

### 07 作用域
和多数语言一样，Go语言中在`{}`内的变量是局部变量，定义在函数外部的变量是全局变量（需要使用var定义，不可以自动推导）。变量重名时优先使用局部变量。

### 08 工程管理
**一**，Go代码必须要放在工作区中。工作区其实是一个对应特定工程的目录，包含三个子目录:
* src，必须，用于以代码包的形式组织并保存Go源码文件。
* pkg，非必须，用于存放经由go install命令构建安装后的代码包。
* bin，非必须，用于存放经由go install命令安装后生成的可执行文件。

需要注意的是，环境变量GOPATH中如果只有一个工作区的路径时，go install命令才会安装到该目录的bin目录下，否则需要设置GOBIN环境变量。

为了能构建某个工程，需要先把工程的根目录加到环境变量GOPATH中，否则代码之间无法通过绝对代码包路径完成调用。注意设置环境变量时Linux下的分隔符是冒号，Windows下的分隔符是分号。

**二**，需要了解一些关于包的使用方式。
```go
//导入时使用.可以在后面使用包中的函数或全局变量时，无需指定包名。类似于Java的静态导入
//但要少使用这种方法，因为可能会和自己定义的函数、变量重名
import . "fmt"
import . "os"

func main() {
	Println("hello world")
	Println("os.Args = ", Args)
}
```
```go
//导入包时还可以给包起别名
import io "fmt"

//导入时可以忽略某个包，编译可以通过。其本质是仅调用该包里的init函数
import _ "fmt"

func main() {
	io.Println("hello world")
}
```

同一个目录下的.go文件中的包名必须一样。同一个目录下，调用别的文件中的函数无需包名引用。

不同的目录，包名不一样。调用不同包的函数，首先要导入该包，并且该函数首字母要大写。

所有用Go编译的单个可执行程序都必须有且仅有一个叫main的包，main包中必须有一个main函数用作程序入口。另外Go还有一个保留的函数init()，这两个函数在定义时都不能有任何参数和返回值。虽然一个package中可以有多个init函数，但从可读性、可维护性的角度出发建议每个package中只写一个init函数。Go程序运行时会自动调用main和init函数（后者在前者之前执行，导入包的init函数在main包的init函数之前执行）

## 第三章 复合类型
符合类型的长度就不像基本数据类型那样是固定的，而是根据内容而变化的。
### 01 指针
指针代表某个内存地址的值，往往是内存中一个变量的起始位置。Go语言对于指针的支持介于Java和C/C++之间，没有像Java一样取消了对指针的直接操作能力，也避免了C/C++中由于对指针的滥用而造成的安全性和可靠性问题。
```go
func main() {
	var a int = 10
	fmt.Printf("a = %d\n", a) //变量a的内容
	fmt.Printf("&a = %v\n", &a) //变量a在内存中的首地址
}
```
为了保存某个变量的地址，需要指针类型。例如要保存`int`类型变量的地址需要`*int`、要保存`*int`类型变量的地址需要`**int`。
```go
func main() {
	var a int = 10
	var p *int //p是指针，此时还没有指向a，默认值为nil
	p = &a
	fmt.Printf("p = %v\n", p)

	*p = 666 //*p操作的不是指针类型变量p的内存，而是p所指向的内存（即a）
}
```
当指针类型为nil时即没有合法指向时，不要通过`*p`的方式进行操作，否则会出现`nil pointer dereference`，即空指针间接引用异常。

除了`*p = &a`这种指向方式，还可以使用`new(T)`函数。该函数将创建一个`T`类型的匿名变量，准确来说是为该类型分配一块新的内存空间，并返回该内存空间的地址，我们可以用指针类型`*T`来接收这个地址。
```go
func main() {
	var p1 *int
	p1 = new(int) //p1指向匿名的int类型变量
	
	p2 := new(int)
	*p2 = 111
}
```
new()函数类似于C语言中的动态申请空间，不过Go语言有内存回收机制，所以开发者只需要申请不需要手动回收内存。

另外，由于Go语言在进行函数调用时使用的是值传递，那么假如我要编写一个函数交换两个整形数的值：
```go
func main() {
	a, b := 1, 2
	Swap(a, b)
	fmt.Printf("In main: %d, %d\n", a, b)
	TrueSwap(&a, &b) //取地址传给指针类型的形参
	fmt.Printf("In main: %d, %d\n", a, b)
}

//该方式仅仅在函数作用域内交换了两个形参的值，但是外部调用的函数中变量a、b的值没有改变
func Swap(a, b int) {
	a, b = b, a
	fmt.Printf("In Swap: %d, %d\n", a, b)
}

//我们需要通过指针来操作原变量内存地址处的内容
func TrueSwap(a, b *int){
	*a, *b = *b, *a
	fmt.Printf("In Swap: %d, %d\n", *a, *b)
}
```

### 02 数组
数组的概念大家都不陌生，Go中定义数组的示例为：
```go
func main() {
	var array [10]int

	for i := 0; i < len(array); i++ {
		array[i] = i + 1 //操作数组时的下标可以是变量
		fmt.Printf("array[%d] = %d\n", i, array[i])
	}
}
```
数组的长度必须是常量（不可以是变量），且是类型的组成部分，`[2]int`和`[3]int`是不同的类型。在Java中我们可以这样写：
```java
public static void main(String[] args) {
	int n = 10;
	int[] array = new int[n];
	System.out.println(array.length);
	n = 20;
	//...
}
```
但Go中就不可以，n必须是一个常量：
```go
func main() {
	const n int = 10
	var arr [n]int
	fmt.Println(len(arr))
}
```
我们可以在声明时就对数组进行初始化（对比Java中可以`int[] arr = new int[]{1, 2, 3};`）：
```go
func main() {
	var array [3]int = [3]int{1, 2, 3} //和变量一样如果直接赋值则前面的类型可以省略
	//array := [3]int {1, 2, 3}
	fmt.Println("array = ", array)

	//Go中可以对数组进行部分初始化，未初始化的元素为默认值
	array2 := [5]int{1, 2, 3} //第0~2个元素被初始化，第3~4个元素默认为0
	fmt.Println("array2 = ", array2)

	//Go中还可以指定某个位置的元素初始化
	array3 := [5]int{2: 10, 4: 20} //只初始化了下标为2和4的元素
	fmt.Println("array3 = ", array3)
}
```
多维数组示例：
```go
func main() {
	var arr [3][4]int
	count := 0

	for i := 0; i < 3; i++ {
		for j := 0; j < 4; j++ {
			arr[i][j] = count
			count++
		}
	}

	fmt.Println(arr)

	arr2 := [3][4]int{{0, 1, 2, 3}, {4, 5, 6, 7}, {8, 9, 10, 11}} //初始化
	arr3 := [3][4]int{{0, 1, 2}, {4, 5, 6}, {8, 9}} //部分初始化
	arr4 := [3][4]int{{0, 1, 2}, {4, 5, 6}} //部分初始化
	arr5 := [3][4]int{1: {4, 5, 6, 7}} //指定初始化第1行
	arr6 := [3][4]int{1: {1: 5, 3: 7}} //指定初始化第1行中的第1、3列
	//使用这些数组...
}
```
Go语言中的数组原生支持用==或!=比较，要求被比较的数组类型一样。（对比Java中只能用Arrays.equals(arr1,arr2)方法来比较）另外，数组也可以通过等号直接用于给同类型的数组赋值。（对比Java中只能用Arrays.copyOf或者System.arrayCopy方法，如果使用等号则仅仅是创建了原数组的一个引用）：
```go
func main() {
	a := [5]int{1, 2, 3, 4, 5}
	b := [5]int{1, 2, 3, 4, 5}
	fmt.Println("a == b? ", a == b)

	//c := a
	var c [5]int
	c = a
}
```
数组如果用作函数的参数，那么是值传递，形参是实参的一份拷贝。如果想要修改同一个数组那么就需要传递指针。
```go
func modify(arrPointer *[5]int) {
	(*arrPointer)[0] = 666
	fmt.Println("Original array modified.")
}
```

拓展：随机数的使用：
```go
import (
	"fmt"
	"math/rand"
	"time"
)

func DoRand()  {
	//设置种子，种子固定后每次运行产生的随机数序列也是固定的（伪随机）
	rand.Seed(666)
	//可以用当前时间作为种子，那么每次运行结果是不一样的
	//rand.Seed(time.Now().UnixNano())

	//产生随机数
	for i := 0; i < 5; i++ {
		fmt.Println("rand = ", rand.Int()) //产生非负的随机整数，范围较大
		fmt.Println("rand = ", rand.Intn(100)) //产生限定范围的整数
	}
}
```

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