var TS_MAIN = [
    'src/web/testCLI.ts',
    'src/web/ehBasicCLI.ts',

    'bin/ehBasicCLI.ts',
    'bin/testCLI.ts',
    'bin/debugger.ts'
];

var GARBAGE = [
    '.tscache',
    'web/js/compiled',
    'src/**/*.js',
    'bin/**/*.js',
    'tests/fs_provider/blob.json'
];

var NOTSOGARBAGE = ['web/bower'];

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-tsd');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-http-server');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-bower-install-simple');
    grunt.loadNpmTasks('grunt-notify');

    grunt.loadTasks('./grunt');

    grunt.initConfig({
        ts: {
            build: {
                src: TS_MAIN
            },
            options: {
                target: 'es5',
                module: 'commonjs',
                declaration: false,
                sourceMap: false,
                removeComments: false,
                noImplicitAny: true
            },
        },

        clean: {
            clean: GARBAGE,
            mrproper: GARBAGE.concat(NOTSOGARBAGE)
        },

        tsd: {
            refresh: {
                options: {
                    command: 'reinstall',
                    latest: true,
                    config: 'tsd.json'
                }
            }
        },

        browserify: {
            options: {
                browserifyOptions: {
                    debug: true
                }
            },
            testCLI: {
                dest: 'web/js/compiled/testCLI.js',
                src: [],
                options: {
                    alias: './src/web/testCLI.js:testCLI'
                }
            },
            ehBasicCLI: {
                dest: 'web/js/compiled/ehBasicCLI.js',
                src: [],
                options: {
                    alias: './src/web/ehBasicCLI:ehBasicCLI:ehBasicCLI'
                }
            }

        },

        mochaTest: {
            test: {
                options: {
                    reporter: 'nyan',
                    ui: 'tdd',
                    bail: false
                },
                src: ['tests/**.js']
            },
            debug: {
                options: {
                    reporter: 'spec',
                    ui: 'tdd',
                    bail: true
                },
                src: ['tests/**.js']
            }
        },

        'http-server': {
            dev: {
                root: 'web',
                port: 6502,
                host: '127.0.0.1',
                autoIndex: true,
                ext: 'html',
                cache: -1
            }
        },

        "bower-install-simple": {
            install: {
                options: {
                    directory: 'web/bower'
                }
            }
        },

        blobify: {
            default: {
                options: {
                    baseDir: './aux'
                },
                src: 'aux/**',
                dest: 'web/js/compiled/files.json'
            },
            test: {
                options: {
                    baseDir: './tests/fs_provider',
                    recurse: true
                },
                src: './tests/fs_provider/tree',
                dest: './tests/fs_provider/blob.json'
            }
        },

        watch: {
            typescript: {
                files: ['src/**/*.ts', 'aux/**'],
                tasks: 'default'
            }
        },

        notify_hooks: {
            options: {
                enabled: true,
                success: true
            }
        }
    });

    grunt.registerTask('bower', ['bower-install-simple']);
    grunt.registerTask('initial', ['clean', 'tsd', 'ts', 'bower', 'browserify']);
    grunt.registerTask('default', ['ts', 'browserify', 'blobify:default']);
    grunt.registerTask('test', ['ts', 'blobify:test', 'mochaTest:test']);
    grunt.registerTask('test:debug', ['ts', 'blobify:test', 'mochaTest:debug']);
    grunt.registerTask('serve', ['default', 'http-server']);

    grunt.task.run('notify_hooks');
};
