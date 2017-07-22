const { spawn } = require('child_process')

spawn('npm', ['run', 'watch:test'], { stdio: false })
spawn('testem', [], { stdio: 'inherit' })
  .on('close', () => process.exit(0))