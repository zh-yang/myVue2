module.exports = function (grunt) {

    // 初始化配置
    grunt.initConfig({
        // 配置 componentBuild 任务
        component_build: {
            build: {
                output: './dist/',
                name: 'vue',
                dev: true,
                sourceUrls: true,
                styles: false,
                scripts: true,
                verbose: true
            }
        },
        jshint: {
            build: {
                src: ['src/**/*.js'],
                options: {
                    jshintrc: "./.jshintrc"
                }
            }
        },
        watch: {
            component: {
                files: ['src/**/*.js', 'component.json'],
                tasks: ['jshint', 'component_build', 'concat:dev']
            }
        }
    });

    // 加载 grunt-component-build 插件
    grunt.loadNpmTasks('grunt-component-build');
    grunt.loadNpmTasks( 'grunt-contrib-watch' )
    grunt.loadNpmTasks( 'grunt-contrib-jshint' )

    // 注册默认任务
    grunt.registerTask('default', ['jshint', 'component_build', 'concat:dev', 'watch']);
    grunt.registerTask( 'concat', function (version) {
        var fs = require('fs'),
            intro = fs.readFileSync('wrappers/intro.js'),
            outro = fs.readFileSync('wrappers/outro.js', 'utf-8'),
            main  = fs.readFileSync('dist/vue.js')
        outro = new Buffer(outro.replace('{{version}}', "'" + version + "'"))
        var all   = Buffer.concat([intro, main, outro])
        fs.writeFileSync('dist/vue.js', all)
    })
};