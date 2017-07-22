const rollup = require('rollup').rollup
const replace = require('rollup-plugin-replace')
const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const uglify = require('rollup-plugin-uglify')
const meta = require('../package.json')

const banner = `/*!
 * Sinai v${meta.version}
 * ${meta.homepage}
 *
 * @license
 * Copyright (c) 2017 ${meta.author}
 * Released under the MIT license
 * ${meta.homepage}/blob/master/LICENSE
 */`

const configs = [
  {
    format: 'cjs',
    dest: `dist/${meta.name}.cjs.js`
  },
  {
    format: 'umd',
    env: 'development',
    dest: `dist/${meta.name}.js`
  },
  {
    format: 'umd',
    env: 'production',
    dest: `dist/${meta.name}.min.js`
  }
]

const baseConfig = {
  entry: 'lib/index.js',
  moduleName: 'Sinai',
  banner,
  external: ['vue'],
  globals: {
    vue: 'Vue'
  },
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true
    }),
    commonjs({
      sourceMap: false
    })
  ]
}

function build (c) {
  const config = Object.assign({}, baseConfig, {
    format: c.format,
    dest: c.dest,
    plugins: baseConfig.plugins.slice()
  })

  if (c.env) {
    config.plugins.push(
      replace({
        'process.env.NODE_ENV': JSON.stringify(c.env)
      })
    )
  }

  if (c.env === 'production') {
    config.plugins.push(
      uglify({
        output: {
          comments (node, comment) {
            const text = comment.value;
            const type = comment.type;
            if (type == "comment2") {
              return /@preserve|@license|@cc_on/i.test(text);
            }
          }
        }
      })
    )
  }

  rollup(config)
    .then(bundle => {
      return bundle.write(config)
    })
    .catch(err => {
      console.error(err)
    })
}

configs.forEach(build)