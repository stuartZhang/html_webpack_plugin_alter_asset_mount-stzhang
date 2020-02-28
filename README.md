# html_webpack_plugin_alter_asset_mount-stzhang

避免将单页应用程序`SPA`中所有脚本的`<script>`标签都一股脑地都放在`<body>`底部或`<head>`标签内。

1. 所有`<script>`标签都放在`<head>`标签里会延长首页白屏时间。
2. 所有`<script>`标签都放在`<body>`底部也会延后一部分视觉敏感程序的初始化时间点。举例来讲，在`px2rem`尺寸计算方案中，
   1. 我们就期望：把计算与设置`<html>`标签`font-size`样式属性值的时间点放在开始渲染`<body>`标签内容之前，以避免内容大小的缩放闪烁。
   2. 甚至，若能做到“把程序代码至少分成两部分，一部分在`<body>`渲染前执行以为`px2rem`做环境准备，另一部分在`<body>`后执行以缩短首页白屏时间”就更完美了。

此`webpack`插件就是为了这个目标而生。

## 工作原理

1. 必须与[html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)插件配套使用。
2. 读取[html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)插件的配置项。
   1. `html_webpack_plugin_alter_asset_mount-stzhang`给[html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)插件添加了一个新配置项`mount`（这是一个选项对象）。
   2. `html_webpack_plugin_alter_asset_mount-stzhang`自身的构造函数也接受包含了`mount`配置项的配置对象。但是，它的优先级更低会被`html-webpack-plugin`插件配置项对象内的`mount`复写（不是合并）。
3. 监听[html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)插件的`html-webpack-plugin-alter-asset-tags`插件事件。正是在这个事件的处理函数里：
   1. 使用给[html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)插件新增的配置项`mount`。
   2. 修改`chunk`脚本文件在`html`页中的注入位置。

## 用法

### 必须与[html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)插件配套使用

### 此插件在`webpack.plugins`插件数组内出现的位置不影响功能的正常运行

`html_webpack_plugin_alter_asset_mount-stzhang`插件被罗列在`html-webpack-plugin`插件前/后都能正常地工作。

### 配置项`mount`在`html-webpack-plugin`插件的构造函数参数里

`mount`配置项会由`html_webpack_plugin_alter_asset_mount-stzhang`插件解析与使用。它的格式：

```javascript
new HtmlWebpackPlugin({
    filename: 'index.html',
    template: 'tmpl/index.html',
    inject: true,
    chunks: ['entry1', 'entry2'],
    mount: { // 新配置项在这里。
        entry1: { // chunk 名 或者 chunk id
            js: 'body' | 'head',  // 指定此 chunk 的脚本文件放在哪
            css: 'body' | 'head'  // 指定此 chunk 的样式文件放在哪
        }
        // 注意：entry2 没有出现在 mount 配置里。所以，`inject: true`
        // 让把它的程序文件放在哪，就放在那。和`HtmlWebpackPlugin`插件
        // 的原有行为保持一致。
    }
})
```

## 安装

`npm i -D html_webpack_plugin_alter_asset_mount-stzhang`

```javascript
const AlertAssetMount = require('html_webpack_plugin_alter_asset_mount-stzhang');
module.exports = {
    // ...
    plugins: [
        new AlertAssetMount() // 上面配置中的 {mount: {entry1: {js, css}}} 配置对象
                              // 出现在构造函数参数里也是可以的。但，注意优先级更低
    ]
    // ...
};
```
