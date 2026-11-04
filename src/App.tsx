import { Header } from './components/Header'
import { Workspace } from './components/Workspace'
import { SystemInfo, Connect } from './components/InfoPanels'
import { TechStack } from './components/TechStack'
import { Stats, Languages, Snake } from './components/GithubPanels'
import { Footer } from './components/Footer'
export default function App() {
  return (<main className="mx-auto flex max-w-[1180px] flex-col gap-3 p-3">
    <Header/>
    <div className="grid gap-3 lg:grid-cols-[1.45fr_1fr]"><Workspace/><div className="flex flex-col gap-3"><SystemInfo/><Connect/></div></div>
    <TechStack/>
    <div className="grid gap-3 md:grid-cols-[1fr_1.1fr_1.1fr]"><Stats/><Languages/><Snake/></div>
    <Footer/>
  </main>)
}
