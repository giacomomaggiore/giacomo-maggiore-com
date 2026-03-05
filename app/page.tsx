import TotViewsClientOnly  from './components/ToTViewsClientOnly'

export default function Page() {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-semibold tracking-tighter">
        Giacomo Maggiore
      </h1>
      <p className="mb-2">
      Born and raised in <a href='https://it.wikipedia.org/wiki/Milano' target='_blank'><b>Milan</b></a>, I studied <a href='https://www.polimi.it/formazione/corsi-di-laurea/dettaglio-corso/ingegneria-dellautomazione'><b>Automation Engineering</b> </a>
       at <a href='https://www.polimi.it/' target='_blank'><i><u>Polimi</u></i></a>, spending one semester abroad in Sweden     at <a href='https://www.mdu.se/en/malardalen-university' target="_blank"><u> <i>MDU</i></u></a>.
<br></br><br></br>
    I've co-founded <a href="https://scenesnap.co/" target='_blank'><u><i>SceneSnap</i></u></a>, a B2B and B2C <b>EdTech startup </b> building an AI-powered learning ecosystem.
    <br></br><br></br>
    I'm now pursuing a Master in <b><a href="https://mtec.ethz.ch/studies.html" target="_blank">Economnics, Management & Technology</a></b> at <a href="https://ethz.ch/en.html" target="_blank"><u><i>ETHZ</i></u></a>, 
    previously worked as a Research Assistant at <a href="https://kof.ethz.ch/en/" target="_blank"KOF Swiss Economic Institute </a> and now as a working student in the Financial Risk team at Zurich Insurance Group.
    
    and working as a research assistant at <a href="https://kof.ethz.ch/it/" target="_blank"><u><i>KOF (Swiss Economic Institute)</i></u></a>.

    <br></br><br></br>
    Deeply interested in how <b>numbers model money</b>: financial risk, macroeconomic forecasting, and both quantitative and personal finance.
    <br></br><br></br>

    Running, cycling and exploring unconventional travel destinations the rest of the time.
    <br></br><br></br>
      </p>

      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        <TotViewsClientOnly />
      </p>
    </section>
  )
}
