import Navbar from '@components/Navbar'
import BottomNav from '@components/BottomNav'

export default function AppLayout({ children, dark, setDark, activeMember, members, activeId, setActiveId, user }) {
  return <div className={`app ${dark ? 'dark' : 'light'}`}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Navbar dark={dark} setDark={setDark} activeMember={activeMember} members={members} activeId={activeId} setActiveId={setActiveId} user={user}/>
    <main id="main-content" className="page-wrap">{children}</main>
    <BottomNav user={user}/>
  </div>
}
