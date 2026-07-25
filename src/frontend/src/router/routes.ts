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
  public?: boolean
  shell?: boolean
  minRole?: Role
  label?: string
  icon?: string
}

export const ROUTES: RouteConfig[] = [
  // ── Public ──
  { path: 'landing', component: LandingPage, public: true, label: 'Início' },
  { path: 'login', component: LoginPage, public: true, label: 'Login' },

  // ── Authenticated ──
  { path: 'dashboard/admin', component: DashboardPage, shell: true, label: 'Visão geral', icon: 'fas fa-th-large' },
  { path: 'dashboard/ots', component: DashboardPage, shell: true, label: 'Ordens de Trabalho', icon: 'fas fa-wrench' },
  { path: 'dashboard/equipment', component: DashboardPage, shell: true, label: 'Equipamentos', icon: 'fas fa-microchip' },
  { path: 'dashboard/clients', component: DashboardPage, shell: true, label: 'Clientes', icon: 'fas fa-briefcase' },
  { path: 'dashboard/buildings', component: DashboardPage, shell: true, label: 'Edifícios', icon: 'fas fa-building' },
  { path: 'dashboard/technicians', component: DashboardPage, shell: true, label: 'Técnicos', icon: 'fas fa-hard-hat' },
  { path: 'projects', component: ProjectsPage, shell: true, label: 'Projetos', icon: 'fas fa-diagram-project' },
  { path: 'presets', component: PresetsPage, shell: true, label: 'Presets', icon: 'fas fa-layer-group' },
  { path: 'dashboard/files', component: DashboardPage, shell: true, label: 'Ficheiros', icon: 'fas fa-folder-open' },
  { path: 'dashboard/ai', component: DashboardPage, shell: true, label: 'Assistente IA', icon: 'fas fa-robot' },
  { path: 'dashboard/calendar', component: DashboardPage, shell: true, label: 'Calendário', icon: 'fas fa-calendar-alt' },
  { path: 'dashboard/user', component: UserDashboardPage, shell: true, label: 'Painel User', icon: 'fas fa-user-gear' },
  { path: 'settings', component: SettingsPage, shell: true, label: 'Definições', icon: 'fas fa-cog', minRole: 'gestor' },
]

export function findRoute(path: string): RouteConfig | undefined {
  return ROUTES.find(r => r.path === path)
}
