import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/app/*', serveStatic({ root: './public' }))

// Main app - serve index.html
app.get('/', (c) => {
  return c.redirect('/app/index.html')
})

app.get('/*', (c) => {
  return c.redirect('/app/index.html')
})

export default app
