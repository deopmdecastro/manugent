import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/app/*', serveStatic({ root: './public' }))

// React SPA - landing & login
app.get('/landing', (c) => c.redirect('/react/index.html'))
app.get('/login', (c) => c.redirect('/react/index.html'))

// API passthrough — let Cloudflare route to the main server
app.get('/api/*', (c) => c.text('API on main server'))

// Main app - serve index.html
app.get('/', (c) => {
  return c.redirect('/app/index.html')
})

// Catch-all: fallback to app
app.get('/*', (c) => {
  return c.redirect('/app/index.html')
})

export default app
