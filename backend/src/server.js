const { env, validateEnv } = require('./config/env')
const connectDB = require('./config/db')
const app = require('./app')

async function startServer() {
  validateEnv()
  await connectDB()

  const server = app.listen(env.port, () => {
    console.log(`\n🚀  HealthyBe API  →  http://localhost:${env.port}`)
    console.log('   /health               GET  – server + DB status')
    console.log('   /api/v1/*             API v1 (legacy /api paths remain available)')
  })

  return server
}

startServer()
