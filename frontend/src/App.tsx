import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { Boxes, History, LayoutDashboard, PackagePlus } from 'lucide-react'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { MovementHistoryPage } from './features/movements/MovementHistoryPage'
import { ProductsPage } from './features/products/ProductsPage'

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Productos', icon: Boxes, end: false },
  { to: '/history', label: 'Historial', icon: History, end: false },
]

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-slate-950 px-4 py-6 text-white lg:block">
          <div className="mb-10 flex items-center gap-3 px-2">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-500 text-slate-950">
              <PackagePlus aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="font-semibold leading-tight">Stock Control</p>
              <p className="text-xs text-slate-400">Inventario de tienda</p>
            </div>
          </div>
          <nav aria-label="Navegacion principal" className="space-y-2">
            {navigation.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
                    isActive
                      ? 'bg-white text-slate-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon aria-hidden="true" size={19} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mb-3 flex items-center gap-2 font-semibold">
            <PackagePlus className="text-emerald-600" aria-hidden="true" size={22} />
            Stock Control
          </div>
          <nav aria-label="Navegacion principal" className="flex gap-2 overflow-x-auto pb-1">
            {navigation.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium ${
                    isActive ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'
                  }`
                }
              >
                <Icon aria-hidden="true" size={17} />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-9">
          <div className="mx-auto max-w-7xl">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/history" element={<MovementHistoryPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
