/** CLI: npm run seed:demo */
import 'dotenv/config'
import { initStore } from '../server/lib/store.mjs'
import { initDb } from '../server/lib/db.mjs'
import { seedDemo } from '../server/lib/seed-demo.mjs'

await initStore()
await initDb()
const result = await seedDemo({ force: true })
console.log(JSON.stringify(result, null, 2))
console.log('\nDemo seed complete. Open /admin to browse filled data.')
process.exit(0)
