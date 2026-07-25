import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/app/*', serveStatic({ root: './public' }))
app.use('/react/*', serveStatic({ root: './public' }))
app.get('/react', (c) => c.redirect('/react/index.html'))

// React SPA routes
app.get('/landing', (c) => c.redirect('/react/index.html'))
app.get('/login', (c) => c.redirect('/react/index.html'))
app.get('/dashboard', (c) => c.redirect('/app/index.html'))
app.get('/dashboard/*', (c) => c.redirect('/app/index.html'))
app.get('/settings', (c) => c.redirect('/app/index.html'))

// API passthrough — let Cloudflare route to the main server
app.get('/api/*', (c) => c.text('API on main server'))

app.get('/', (c) => {
  return c.redirect('/landing')
})

app.get('/*', (c) => {
  return c.redirect('/react/index.html')
})

export default app
