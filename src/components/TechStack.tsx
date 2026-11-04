import { Panel } from './Panel'
import { Icon } from './Icon'
import { techGroups } from '../icons/registry'
// Desktop (lg): one 3-column grid, so rows align -> row 1 Languages | Frontend | Backend, row 2 Database | AI / ML | Tools.
// Column rules are drawn with borders (vertical between columns, horizontal between rows). Below lg the categories stack
// (1 column < sm, 2 columns sm..lg; icons in a 5-column grid from 360px, 3 columns below) with a divider above each category and a fixed icon/label rhythm.
export function TechStack() {
  return (<Panel title="Tech Stack" hint="about | what i build with" dot="emerald">
    <div className="grid sm:grid-cols-2 lg:grid-cols-[1.3fr_1.2fr_0.85fr]" data-tech-grid>
      {techGroups.map((g, i) => {
        const col = i % 3, row = Math.floor(i / 3)
        const cls = [
          'min-w-0 border-edge/70 py-4',
          i === 0 ? 'pt-0' : '', i === 1 ? 'sm:pt-0' : '',
          i > 0 ? 'max-sm:border-t' : '', i > 1 ? 'sm:max-lg:border-t' : '',
          'lg:px-6', col === 0 ? 'lg:pl-0' : 'lg:border-l', col === 2 ? 'lg:pr-0' : '',
          row === 0 ? 'lg:pt-0' : 'lg:border-t lg:pt-5', row === 1 ? 'lg:pb-0' : '', i === 5 ? 'pb-0' : '', i === 4 ? 'sm:pb-0' : '',
        ].join(' ')
        return (<div key={g.title} className={cls} data-tech-group={g.title}>
          <h3 className="mb-3 text-xs text-dim">{g.title}</h3>
          <div className="grid grid-cols-3 gap-y-4 min-[360px]:grid-cols-5 lg:flex lg:gap-x-3.5">
            {g.items.map(it => (<div key={g.title + it.label} className="flex flex-col items-center gap-2 lg:min-w-14" data-tech-item>
              <span className="grid size-9 place-items-center"><Icon spec={it}/></span>
              <span className="h-7 text-center text-[10px] leading-[14px] lg:h-auto lg:whitespace-nowrap">{it.label}</span>
            </div>))}
          </div>
        </div>)
      })}
    </div>
  </Panel>)
}
