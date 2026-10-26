/** PM2 process file — keeps the automation server always running */
module.exports = {
  apps: [
    {
      name: 'jacmotors-automation',
      script: 'server/index.mjs',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 8787,
      },
    },
  ],
}
