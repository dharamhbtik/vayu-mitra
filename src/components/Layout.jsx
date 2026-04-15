import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

function Layout() {
  return (
    <div className="flex flex-col min-h-screen pb-16">
      <main className="flex-1 p-4 max-w-md mx-auto w-full">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

export default Layout
