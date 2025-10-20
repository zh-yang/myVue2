module.exports = function (grunt) {

    // 初始化配置
    grunt.initConfig({
        // 配置 componentBuild 任务
        component_build: {
            dev: {
                output: './dist/',
                name: 'vue',
                dev: true,
                sourceUrls: true,
                styles: false,
                verbose: true
            },
            build: {
                output: './dist/',
                name: 'vue',
                styles: false
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
        uglify: {
            build: {
                options: {
                    compress: false,
                    mangle: false
                },
                files: {
                    'dist/vue.min.js': 'dist/vue.js'
                }
            }
        },
        watch: {
            component: {
                files: ['src/**/*.js', 'component.json'],
                tasks: ['jshint', 'component_build:dev', 'concat:dev']
            }
        }
    });

    // 加载 grunt-component-build 插件
    grunt.loadNpmTasks('grunt-component-build');
    grunt.loadNpmTasks( 'grunt-contrib-watch' )
    grunt.loadNpmTasks( 'grunt-contrib-jshint' )
    grunt.loadNpmTasks( 'grunt-contrib-uglify' )

    // 注册默认任务
    grunt.registerTask('default', ['watch']);
    grunt.registerTask('dev', ['jshint', 'component_build:dev', 'concat:dev']);
    grunt.registerTask( 'concat', function (version) {
        var fs = require('fs'),
            intro = fs.readFileSync('wrappers/intro.js'),
            outro = fs.readFileSync('wrappers/outro.js', 'utf-8'),
            main  = fs.readFileSync('dist/vue.js')
        outro = new Buffer.from(outro.replace('{{version}}', "'" + version + "'"))
        var all   = Buffer.concat([intro, main, outro])
        fs.writeFileSync('dist/vue.js', all)
    })
    grunt.registerTask( 'version', function (version) {
        var fs = require('fs')
        ;['package', 'bower', 'component'].forEach(function (file) {
            file = './' + file + '.json'
            var json = fs.readFileSync(file, 'utf-8')
            json = json.replace(/"version"\s*:\s*"(.+?)"/, '"version": "' + version + '"')
            fs.writeFileSync(file, json)
        })
    })
    
    grunt.registerTask( 'build', function (version) {
        grunt.task.run([
            'jshint',
            'component_build:build',
            'concat:' + version,
            'uglify',
            'version:' + version
        ])
    })
};