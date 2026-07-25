import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { AuthGuard } from './guards/AuthGuard'
import { useAuth } from './hooks/useAuth'
import { ROUTES } from './router/routes'

export function App() {
  const { isAuthenticated } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        {ROUTES.map((r) => {
          const Component = r.component
          const key = r.path

          if (r.public) {
            return <Route key={key} path={`/${key}`} element={<Component />} />
          }

          if (r.shell) {
            return (
              <Route
                key={key}
                path={`/${key}`}
                element={
                  isAuthenticated ? (
                    <AppShell>
                      <AuthGuard requiredRole={r.minRole}>
                        <Component />
                      </AuthGuard>
                    </AppShell>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            )
          }

          return (
            <Route
              key={key}
              path={`/${key}`}
              element={
                isAuthenticated ? (
                  <AuthGuard requiredRole={r.minRole}>
                    <Component />
                  </AuthGuard>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          )
        })}

        {/* Catch-all: redirect to landing */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
