---
title: 使用Selenium进行web自动化测试
date: 2021-03-28
tags:
 - Web自动化
categories:
 - 知海拾贝
---

:::tip
毕设中有一部分内容涉及到使用自动化脚本批量访问目标网站列表中的所有网站，再进一步采集相关数据。Selenium是一款流行的开源框架，这次就来学习使用Selenium进行web自动化测试。
:::

## 使用步骤

### 01 导入框架
Selenium Webdriver框架支持Java、Python等多种语言进行开发，我们使用Maven来管理。在IDEA中创建Maven项目并添加依赖，我选择了较新且使用人数较多的正式版本：
```xml
    <dependencies>
        <!-- https://mvnrepository.com/artifact/org.seleniumhq.selenium/selenium-java -->
        <dependency>
            <groupId>org.seleniumhq.selenium</groupId>
            <artifactId>selenium-java</artifactId>
            <version>3.141.59</version>
        </dependency>
    </dependencies>
```

### 02 测试框架运行
导入依赖后我们就可以通过ChromeDriver和FirefoxDriver这两个类来控制Chrome和Firefox浏览器了，不过需要注意的是在使用前需要下载对应系统的驱动到本地并设置系统属性，否则无法启动浏览器。驱动下载的镜像地址为：`http://npm.taobao.org/mirrors/chromedriver`和`https://npm.taobao.org/mirrors/geckodriver/`。
```java
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

public class FirstWebTest {
    public static void main(String[] args) {
        openFirefox();
    }

    private static void openChrome() {
        //在系统属性中设置对应的驱动位置
        System.setProperty("webdriver.chrome.driver", "/home/wallace/webDrivers/chromedriver");
        //打开chrome浏览器
        ChromeDriver chromeDriver = new ChromeDriver();
        //访问网站
        chromeDriver.get("https://www.baidu.com");
    }

    private static void openFirefox() {
        System.setProperty("webdriver.gecko.driver", "/home/wallace/webDrivers/geckodriver");
        FirefoxDriver firefoxDriver = new FirefoxDriver();
        firefoxDriver.get("https://www.baidu.com");
    }
}
```

## WebDriver相关API
常用的API有：
* get(String url) //访问指定url页面
* getCurrentUrl() //获取当前页面的URL
* getTitle() //获取当前的页面标题
* getPageSource() //获取当前页面的源代码
* quit() //关闭驱动对象以及所有相关窗口
---
* close() //关闭当前窗口或标签，不会关闭驱动或浏览器
* getWindowHandle() //返回当前页面句柄
* getWindowHandles() //返回所有由驱动对象打开页面的句柄，页面不同则句柄不一样
* manage() //获取Options--即浏览器菜单操作对象
---
Navigation对象：Navigation nav = driver.navigate();
* nav.to(URL) //访问指定URL
* nav.refresh() //刷新
* nav.back() //后退
* nav.forward() //前进

## 元素三种等待
### 01 硬性等待
通过`Thread.sleep(long millis);`的方式强制线程等待。
```java
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.By;

public class ElementWait {
    private static ChromeDriver chromeDriver;

    public static void main(String[] args) throws InterruptedException {
        openChrome();
        ChromeDriver.get("https://www.baidu.com");
        chromeDriver.findElement(By.id("kw")).sendKeys("Some key words");
        chromeDriver.findElement(By.id("su")).click();
        //这里如果不等待的话代码执行太快而UI元素没有立即加载出来，导致找不到元素
        Thread.sleep(3000);
        chromeDriver.findElement(By.xpath("Some key words")).click();
    }

    private static void openChrome() {
        System.setProperty("webdriver.chrome.driver", "/home/wallace/webDrivers/chromedriver");
        chromeDriver = new ChromeDriver();
    }
}
```

## 02 隐式等待
隐式等待可以在设置的时间范围内不断查找元素，直到找到元素或者超时。使用方式为`driver.manage().timeouts().implicitlyWait(long time, TimeUnit unit)`。该种方式相对灵活，在WebDriver实例的整个生命周期中都有效，但并不是所有的元素都需要等待。
```java
public static void main(String[] args) throws InterruptedException {
    openChrome();
    //在driver实例化完成后就可以设置隐式等待时间，对所有动作都生效
    chromeDriver.manage().timeouts().implicitlyWait(5, TimeUnit.SECONDS);

    ChromeDriver.get("https://www.baidu.com");
    chromeDriver.findElement(By.id("kw")).sendKeys("Some key words");
    chromeDriver.findElement(By.id("su")).click();
    chromeDriver.findElement(By.xpath("Some key words")).click();
}
```

## 03 显式等待
用于等待某个条件发生后再继续执行后续代码（例如找到元素、元素可点击、元素已显示等）。使用方式为：
```java
WebDriverWait wait = new WebDriverWait();
WebElement ele = wait.until(expectCondition);
```
示例：
```java
private static void openFirefox() {
    System.setProperty("webdriver.gecko.driver", "/home/wallace/webDrivers/geckodriver");
    FirefoxDriver firefoxDriver = new FirefoxDriver();
    firefoxDriver.get("https://www.baidu.com");
    firefoxDriver.findElement(By.id("kw")).sendKeys("Some key words");
    firefoxDriver.findElement(By.id("su")).click();

    WebDriverWait webDriverWait = new WebDriverWait(firefoxDriver, 5);
    webDriverWait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("Some key words")));
}
```

## 使用实战
为了抓取流量，要控制浏览器访问多个目标网站，网站的域名被存储在文本文件中。
```java
import org.openqa.selenium.By;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.remote.RemoteWebDriver;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.util.Scanner;
import java.util.concurrent.TimeUnit;

public class FirstWebTest {
    public static void main(String[] args) throws FileNotFoundException {
        System.setProperty("webdriver.gecko.driver", "/home/wallace/Projects/Selenium/webDrivers/geckodriver");
        System.setProperty("webdriver.chrome.driver", "/home/wallace/Projects/Selenium/webDrivers/chromedriver");

        Scanner scanner = new Scanner(new FileInputStream("/home/wallace/Projects/Selenium/domain_names.txt"));

        ChromeDriver chromeDriver = new ChromeDriver();
        useBrowser(chromeDriver, scanner);

        FirefoxDriver firefoxDriver = new FirefoxDriver();
        useBrowser(firefoxDriver, scanner);
    }

    private static void useBrowser(RemoteWebDriver driver, Scanner domainScanner) {
        driver.manage().timeouts().implicitlyWait(5, TimeUnit.SECONDS);
        String url;
        String originalWindow = driver.getWindowHandle();
        assert driver.getWindowHandles().size() == 1;
        
        while (domainScanner.hasNextLine()) {
            url = "https://" + domainScanner.nextLine();
            driver.executeScript("window.open()");
            for (String windowHandle : driver.getWindowHandles()) {
                if (!originalWindow.contentEquals(windowHandle)) {
                    driver.switchTo().window(windowHandle);
                    driver.get(url);
                    driver.close();
                    driver.switchTo().window(originalWindow);
                }
            }
        }
    }

}
```