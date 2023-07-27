
调试开发阶段。用于追踪事件不同阶段的执行情况
===================

* 什么情况下需要安装这个工具帮助你进行调试
  * 项目开发有多个前段开发人员
  * 没有统一的事件绑定管理
  * 多处事件绑定后，绑定事件没有触发。（其他开发人员捕获该事件中断了事件默认流程）
  * 该项目仅仅用于调试目的。协助查找事件流程在哪中断。
  


* 如果你任然需要该库的协助
  
  ### 安装
    ```
    npm install event-dispatch-path
    ```
  ### 使用 (保证在项目入口进行加载)
  
    ```typescript
    import listenerDefaultEventTree from "event-dispatch-path";

    // 你需要监听调试的方法名
    listenerDefaultEventTree('click')
    listenerDefaultEventTree(['click','keyup'])
    ```
  ### 打包
    ```
    使用webpack等类似构建工具。在打包环境为process.env.NODE_ENV === "production"时。
    1：该库仅仅在调试期间发挥作用
    2：不需要做任何更改，该库在打包后不会执行任何代码。
    ```
  ### Vue项目支持


    |1|2|3|4|5|6|7|8|9|
    |-|-|-|-|-|-|-|-|-|-|
    |⇓ Vue:no_vue|-|-|-|-|-|-|⇑ Vue:is_vue|document|
    |-|⇓ Vue:no_vue|-|-|-|-|⇑ Vue:is_vue|-|div#root(Root节点)|
    |-|-|⇓ Vue:is_vue|-|-|⇑ Vue:is_vue|-|-|div.content|
    |-|-|-|⇌ Vue:no_vue|⇌ Vue:no_vue|-|-|-|button|


  ### React项目(新版 合成事件由React App根节点进行模拟派发) 输入内容如下
  
  
    |1|2|3|4|5|6|7|8|9|
    |-|-|-|-|-|-|-|-|-|-|
    |⇓ react:原生事件|-|-|-|-|-|-|⇑ react:原生事件|document|
    |-|⇓ react:原生事件|-|-|-|-|⇑ react:原生事件|-|div#root(Root节点)|
    |-|-|⇓ react:原生事件|-|-|⇑ react:原生事件|-|-|div.content|
    |-|-|-|⇌ react:原生事件|⇌ react:原生事件|-|-|-|button|

    ```
    JS原生事件(click)流结束,结束于(冒泡),最后响应元素: [document]
    React事件,捕获冒泡流程执行完成，无中断。终止于： [div#root]
    ```
    或者
    ```
    JS原生事件(click)流结束,结束于(冒泡),最后响应元素: [div#root]
    React事件,捕获冒泡流程执行完成,被中断。            
        文件路径：/xx/x/App.js            
        组件：【App】            
        在该方法中中断： [ƒ]
    ```



  ### Raect项目(旧版 合成事件由节点document进行模拟派发) 

  
     |1|2|3|4|5|6|7|8|9|
    |-|-|-|-|-|-|-|-|-|-|
    |⇓ react:原生事件|-|-|-|-|-|-|⇑ react:原生事件|document|
    |-|⇓ react:原生事件|-|-|-|-|⇑ react:原生事件|-|div#root|
    |-|-|⇓ react:原生事件|-|-|⇑ react:原生事件|-|-|div.content|
    |-|-|-|⇌ react:原生事件|⇌ react:原生事件|-|-|-|button|
    ```
    JS原生事件(click)流结束,结束于(冒泡),最后响应元素: [document]
    React事件,捕获冒泡流程执行完成，无中断。终止于： [document]
    ```
    或者
    ```
    JS原生事件(click)流结束,结束于(冒泡),最后响应元素: [document]
    React事件,捕获冒泡流程执行完成,被中断。            
        文件路径：/xx/x/App.js            
        组件：【App】            
        在该方法中中断： [ƒ]
    ```