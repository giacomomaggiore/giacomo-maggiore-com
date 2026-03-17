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

    I've co-founded <a href="https://scenesnap.co/" target='_blank'><u><i>SceneSnap</i></u></a>, then movedo to <b>Zurich</b> to pursue a Master in <b><a href="https://mtec.ethz.ch/studies.html" target="_blank">Economnics, Management & Technology</a></b> at <a href="https://ethz.ch/en.html" target="_blank"><u><i>ETHZ</i></u></a>.
    <br></br><br></br>
    I previously worked as a Research Assistant at <a href="https://kof.ethz.ch/en/" target="_blank"><u><i>KOF Swiss Economic Institute</i></u></a>, now as a working student in the <b>financial risk </b> team at <a href="https://www.zurich.com/" target="_blank"><u><i>Zurich Insurance Group.</i></u></a>
    
    <br></br><br></br>
    Deeply interested in how <b>numbers model money</b>: economic dynamics, time-series analysis, and both quantitative and personal finance.
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
