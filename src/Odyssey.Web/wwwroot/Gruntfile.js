module.exports = function(grunt) {
	require('matchdep')
		.filterDev('grunt-*')
		.forEach(grunt.loadNpmTasks);

	const files = {
		appjs: [
			'App/**/*.js',
			'!App/build/**/*'
		],
		testjs: [
			'Tests/**/*.js'
		],
		htmlIndex: [
			'../Pages/index.cshtml'
		],
		html: [
			'Tests/**/*.html'
		],
		styles: [
			'Styles/site.less'
		]
	};

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		htmlhint: {
			index: {
				options: {
					'tag-pair': true,
					'tagname-lowercase': true,
					'attr-lowercase': true,
					'attr-value-double-quotes': true,
					'spec-char-escape': false,
					'id-unique': true,
					'style-disabled': true
				},
				src: files.htmlIndex
			},
			app: {
				options: {
					'tag-pair': true,
					'tagname-lowercase': true,
					'attr-lowercase': true,
					'attr-value-double-quotes': true,
					'spec-char-escape': true,
					'id-unique': true
				},
				src: files.html
			}
		},
		jshint: {
			options: {
				curly: false,
				eqeqeq: false,
				eqnull: true,
				esversion: 14,
				module: true,
				browser: true,
				multistr: true,
				smarttabs: true,
				unused: true,
				undef: true,
				globals: {
					'console': true,
					'indexedDB': true,
					'ResizeObserver': true
				}
			},
			app: files.appjs,
			tests: {
				options: {
					jasmine: true
				},
				src: files.testjs
			}
		},
		less: {
			dev: {
				files: {
					'Styles/site.css': files.styles
				},
				options: {
					compress: false
				}
			},
			release: {
				files: {
					'Styles/site.min.css': files.styles
				},
				options: {
					compress: true
				}
			}
		},
		watch: {
			html: {
				files: files.html.concat(files.htmlIndex),
				tasks: ['htmlhint']
			},
			jshint: {
				files: files.appjs.concat(files.testjs),
				tasks: ['jshint']
			},
			less: {
				files: files.styles,
				tasks: ['less:dev']
			}
		}
	});

	//bundles and minifies the ES modules of the game into a single file for release
	grunt.registerTask('bundle', 'Bundles App/main.js into App/build/main-built.js', function() {
		const done = this.async();
		require('esbuild')
			.build({
				entryPoints: ['App/main.js'],
				outfile: 'App/build/main-built.js',
				bundle: true,
				minify: true,
				format: 'esm',
				target: 'es2022',
				legalComments: 'none'
			})
			.then(() => done(), error => {
				grunt.log.error(error.message);
				done(false);
			});
	});

	grunt.registerTask('default', ['release']);
	grunt.registerTask('debug', ['htmlhint', 'jshint', 'less:dev']);
	grunt.registerTask('release', ['htmlhint', 'jshint', 'less:release', 'bundle']);
};
