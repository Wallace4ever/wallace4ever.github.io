---
title: 使用VuePress与GitHub Pages快速搭建个人博客
date: 2020-09-11
tags:
 - Markdown
categories:
 - 知海拾贝
---

::: tip
有朋友询问本博客如何搭建，其实相关的框架产品和教程有很多，那这次就来简单分享下使用VuePress + GitHub Pages搭建个人静态博客的方法。
:::
<!-- more -->

# 前言
目前几种主流的静态博客框架都是基于Node.js渲染解析Markdown实现的，所以只要你学会简单的Markdown语法就可以快速开始写作。其中，Hexo有着丰富的博客主题模板并可以灵活地增加、切换主题，另外创建文章、渲染网页文件以及发布到托管网站都只需要一条指令就能完成，如果你喜欢为博客配置多样的主题那么Hexo可能更适合你；GitBook和VuePress诞生之初主要是面向文档的写作而非个人博客，基于后者也陆续出现了一些优秀的博客插件，本博客就使用了@`reco_luan`等贡献者编写的`vuepress-theme-reco`主题插件，感谢他们的工作。下面就来看看怎么搭建自己的博客吧。

## 安装配置Node.js
首先你需要配置好Node.js环境，以便后面的步骤能正常完成。访问[Node.js官网](https://nodejs.org/zh-cn/)下载适合自己操作系统的版本。

通常情况下保持默认的安装选项就可以了，安装完成后确认`node`和`npm`被添加到环境变量中。在终端运行`node -v`和`npm -v`，如果输出版本号就没有问题了。

另外还需要将npm镜像源切换到国内的镜像站来保证后面较快的下载安装速度。
```bash
npm config set registry https://registry.npm.taobao.org
```

## 安装配置Git
为了能将最后生成的博客网页源文件push到托管服务器上，还需要安装Git版本控制工具。不同操作系统的安装方式不同：
* MacOS 可以直接在终端运行`xcode-select --install`安装Xcode Command Line Tools，安装完成之后Git就可以使用了。
* 各Linux发行版可以使用包管理器如yum、apt、pacman来直接安装。
* Windows需要下载[安装包](https://git-scm.com/downloads)进行安装。

安装完毕之后记得配置个人的姓名和电子邮箱：
```bash
$ git config --global user.name "Your Name"
$ git config --global user.email "email@example.com"
```

## 创建博客仓库
GitHub、Gitee、GitLab等托管服务商都推出了Pages服务，国内用户可能访问码云的速度会快一些，下面以GitHub为例，点击New Repository创建一个新的仓库：

![9YfK4.png](https://wx1.sbimg.cn/2020/09/11/9YfK4.png)

仓库一定要命名为`你的GitHub用户名.github.io`，这样才能用作GitHub Pages。

![9Z4TY.png](https://wx2.sbimg.cn/2020/09/11/9Z4TY.png)

接下来点击仓库设置：

![9ZmN7.png](https://wx1.sbimg.cn/2020/09/11/9ZmN7.png)

找到GitHub Pages的选项，你会看到有提示你此仓库可以作为GitHub Pages，选择master分支作为构建Pages的分支，并任选一个初始化主题，稍等一段时间就可以访问`username.github.io`了。后面我们新创建一个分支来管理博客的源文件，并使用VuePress生成的博客覆盖master分支中的内容。

![9UTlY.png](https://wx2.sbimg.cn/2020/09/12/9UTlY.png)


## 安装VuePress以及博客主题
VuePress-theme-reco自带了脚手架，可以便捷地安装VuePress组件以及初始化博客的配置，可以从博客和文档风格中进行选择。
```bash
# 使用npm安装脚手架
npm install @vuepress-reco/theme-cli -g
# 使用脚手架完成剩余的安装配置工作
theme-cli init
```
安装过程中会要求你配置博客在本地的存储目录，完成后目录下会新增`.vuepress`（配置及资源文件）、`views`（Markdown源文件）、`node_modules`（npm下载安装的包）、`public`（生成的静态网页文件）文件夹以及一些配置文件。

![9UVCA.png](https://wx1.sbimg.cn/2020/09/12/9UVCA.png)

这时，当你写完一些Markdown文章之后就可以生成你的博客站点了。
* 使用`npm run dev`命令启用本地web服务器，访问localhost://8080来临时查看博客的效果
* 使用`npm run build`命令来生成博客的静态文件到public目录下

## 将博客部署到GitHub
可选步骤：我们在GitHub中为仓库创建一个新的分支用于存储博客源文件，例如取名为source分支。使用Git将该仓库克隆到本地，再通过`git checkout source`切换到source分支，将本地的`.git`隐藏文件夹拷贝到博客根目录下，我们就在source分支下进行书写工作了。之后也可以commit在此分支下编辑的内容并push到远程仓库中。

在项目根目录下创建`.gitignore`文件并写入我们希望Git在追踪时忽略的目录：
```text
node_modules/
docs/.vuepress/theme
package-lock.json
package.json
public/
```
这样我们就可以将改动同步到GitHub服务器的远程仓库上，但在这之前，我们还需要生成SSH Key并添加到GitHub账户中。

### 1. 生成SSH Key
使用ssh-keygen来生成秘钥，参数为你注册GitHub的邮箱，期间需要输入保存的文件路径以及passphrase，直接回车保持默认即可，生成的秘钥默认在用户主目录的`.ssh`文件夹下。
```bash
ssh-keygen -t rsa -C "youremail@example.com"
```
下面查看生成的.pub文件内容：
```bash
# Linux/MacOS用户
cat ~/.ssh/id_rsa.pub
# Windows用户需要打开C盘下Users/用户目录下的.ssh文件夹
```

### 2. 添加Key到GitHub账户
点击GitHub右上方个人头像，选择菜单中的settings，找到SSH and GPG keys，选择添加SSH Key。任取一个标题（我一般写设备名称便于区分）并将.pub文件中的内容拷贝上去。

添加完成后在终端中测试是否添加成功：
```bash
ssh -T git@github.com
# 出现这句话说明成功
Hi Wallace4ever! You've successfully authenticated, but GitHub does not provide shell access.
```

### 3. 部署博客到master分支
前面我们提到运行`npm run build`即可生成博客的静态文件到public目录，那么我们可以写一个简单的shell脚本用于快速部署，创建一个脚本文件（例如deploy.sh）将脚本保存起来。
```bash
npm run build
cd public
git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:Wallace4ever/wallace4ever.github.io.git master
cd ../
```
在终端中直接运行`./deploy.sh`即可（注意Linux/MacOS下需要将脚本文件权限改为可执行的，Windows不需要但要通过git bash for windows执行，推荐使用VS Code并选择合适的终端Shell）。

***
更多博客的配置、插件的使用可以移步[主题官网](https://vuepress-theme-reco.recoluan.com/)查看详细的文档。