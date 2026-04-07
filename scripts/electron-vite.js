const { spawn } = require('child_process')

delete process.env.ELECTRON_RUN_AS_NODE

const child = spawn('electron-vite', process.argv.slice(2), {
  stdio: 'inherit',
  shell: true,
  env: process.env
})

child.on('exit', (code) => process.exit(code ?? 0))
