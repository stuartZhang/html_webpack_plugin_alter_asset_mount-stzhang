const pkg = require('../package.json');
module.exports = class HtmlWebpackAlterAssetPlugin{
    constructor(options){
        this.options = options;
    }
    apply(compiler){
        const hookCallback = compilation => {
            if (compilation.hooks) { // webpack 4
                if (typeof compilation.hooks.htmlWebpackPluginAlterAssetTags === 'object') {
                    compilation.hooks.htmlWebpackPluginAlterAssetTags.tap(pkg.name, htmlPluginData => this.handle(htmlPluginData));
                } else {
                    const HtmlWebpackPlugin = require('html-webpack-plugin');
                    HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tap(pkg.name, ({headTags, bodyTags, ...rest}) => {
                        const {chunks} = compilation.getStats().toJson({chunks: true});
                        this.handle({
                            head: headTags,
                            body: bodyTags,
                            chunks,
                            ...rest
                        });
                    });
                }
            } else { // webpack 3
                compilation.plugin('html-webpack-plugin-alter-asset-tags', (htmlPluginData, callback) => {
                    this.handle(htmlPluginData);
                    callback();
                });
            }
        };
        if (compiler.hooks) { // webpack 4
            compiler.hooks.afterCompile.tap(pkg.name, hookCallback);
        } else { // webpack 3
            compiler.plugin('afterCompile', hookCallback);
        }
    }
    handle(htmlPluginData){
        const {head, body, plugin, chunks/* , outputName */} = htmlPluginData;
        let {mount} = this.options || {};
        if (typeof plugin.options.mount === 'object') {
            ({mount} = plugin.options);
        }
        if (typeof mount === 'object') {
            for (const chunkName of Object.keys(mount)) {
                const {js, css} = mount[chunkName];
                const chunk = chunks.find(({id, names, idHints, runtime}) => {
                    if (plugin.version >= 4) {
                        return idHints.some(id => id === chunkName || `${id}~${runtime.join('~')}` === chunkName);
                    }
                    return id === chunkName || ~names.indexOf(chunkName);
                });
                if (chunk) {
                    let index;
                    if (js === 'head') {
                        while ((index = body.findIndex(({attributes: {src}}) => src && chunk.files.some(file => src.endsWith(file)))) > -1) {
                            const [move] = body.splice(index, 1);
                            head.push(move);
                        }
                    } else if (js === 'body') {
                        while ((index = head.findIndex(({attributes: {src}}) => src && chunk.files.some(file => src.endsWith(file)))) > -1) {
                            const [move] = head.splice(index, 1);
                            body.push(move);
                        }
                    } else if (js != null) {
                        console.info('\n', pkg.name, '无效的 js 挂载点:', js);
                    }
                    if (css === 'head') {
                        while ((index = body.findIndex(({attributes: {href}}) => href && chunk.files.some(file => href.endsWith(file)))) > -1) {
                            const [move] = body.splice(index, 1);
                            head.push(move);
                        }
                    } else if (css === 'body') {
                        while ((index = head.findIndex(({attributes: {href}}) => href && chunk.files.some(file => href.endsWith(file)))) > -1) {
                            const [move] = head.splice(index, 1);
                            body.push(move);
                        }
                    } else if (css != null) {
                        console.info('\n', pkg.name, '无效的 css 挂载点:', css);
                    }
                } else {
                    console.info('\n', pkg.name, '不存在的 chunk-id:', chunkName);
                }
            }
        } else {
            console.warn('\n', pkg.name, '被期望的 mount 配置项在 html-webpack-plugin 插件配置中没有出现');
        }
    }
};
