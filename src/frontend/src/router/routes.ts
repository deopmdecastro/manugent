import type { ComponentType } from 'react'
import { LoginPage } from '../pages/LoginPage'
import { LandingPage } from '../pages/LandingPage'

export interface RouteConfig {
  path: string
  component: ComponentType
  public?: boolean
  shell?: boolean
  label?: string
  icon?: string
}

export const ROUTES: RouteConfig[] = [
  { path: 'landing', component: LandingPage, public: true, label: 'Início' },
  { path: 'login', component: LoginPage, public: true, label: 'Login' },
]

export function findRoute(path: string): RouteConfig | undefined {
  return ROUTES.find(r => r.path === path)
}
