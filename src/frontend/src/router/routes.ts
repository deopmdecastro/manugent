import type { ComponentType } from 'react'
import type { Role } from '../hooks/useAuth'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { LandingPage } from '../pages/LandingPage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { PresetsPage } from '../pages/PresetsPage'
import { UserDashboardPage } from '../pages/user/UserDashboardPage'
import { SettingsPage } from '../pages/SettingsPage'

export interface RouteConfig {
  path: string
  component: ComponentType
  /** If true, the route is public — no auth needed */
  public?: boolean
  /** If true, wraps in AppShell */
  shell?: boolean
  /** Minimum role required */
  minRole?: Role
  /** Label for navigation */
  label?: string
  /** Icon for navigation */
  icon?: string
}

export const ROUTES: RouteConfig[] = [
  // ── Public ──
  { path: 'landing', component: LandingPage, public: true, label: 'Início' },
  { path: 'login', component: LoginPage, public: true, label: 'Login' },

  // ── Authenticated ──
  { path: 'dashboard', component: DashboardPage, shell: true, label: 'Visão geral', icon: 'fas fa-th-large' },
  { path: 'ots', component: DashboardPage, shell: true, label: 'Ordens de Trabalho', icon: 'fas fa-wrench' },
  { path: 'equipment', component: DashboardPage, shell: true, label: 'Equipamentos', icon: 'fas fa-microchip' },
  { path: 'clients', component: DashboardPage, shell: true, label: 'Clientes', icon: 'fas fa-briefcase' },
  { path: 'buildings', component: DashboardPage, shell: true, label: 'Edifícios', icon: 'fas fa-building' },
  { path: 'technicians', component: DashboardPage, shell: true, label: 'Técnicos', icon: 'fas fa-hard-hat' },
  { path: 'projects', component: ProjectsPage, shell: true, label: 'Projetos', icon: 'fas fa-diagram-project' },
  { path: 'presets', component: PresetsPage, shell: true, label: 'Presets', icon: 'fas fa-layer-group' },
  { path: 'files', component: DashboardPage, shell: true, label: 'Ficheiros', icon: 'fas fa-folder-open' },
  { path: 'ai', component: DashboardPage, shell: true, label: 'Assistente IA', icon: 'fas fa-robot' },
  { path: 'calendar', component: DashboardPage, shell: true, label: 'Calendário', icon: 'fas fa-calendar-alt' },
  { path: 'user-dashboard', component: UserDashboardPage, shell: true, label: 'Painel User', icon: 'fas fa-user-gear' },
  { path: 'settings', component: SettingsPage, shell: true, label: 'Definições', icon: 'fas fa-cog', minRole: 'gestor' },
]

export function findRoute(path: string): RouteConfig | undefined {
  return ROUTES.find(r => r.path === path)
}
