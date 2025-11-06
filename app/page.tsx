import TotViewsClientOnly  from './components/ToTViewsClientOnly'

export default function Page() {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-semibold tracking-tighter">
        Giacomo Maggiore
      </h1>
      <p className="mb-2">
      Born and raised in <a href='https://it.wikipedia.org/wiki/Milano' target='_blank'><b>Milan</b></a>, I studied <a href='https://www.polimi.it/formazione/corsi-di-laurea/dettaglio-corso/ingegneria-dellautomazione'><u><i>Automation Engineering</i></u> </a>
       at <a href='https://www.polimi.it/' target='_blank'><b>Polimi</b></a>, spending one semester abroad in Sweden     at <a href='https://www.mdu.se/en/malardalen-university' target="_blank"><u> <i>MDU</i></u></a>.
<br></br><br></br>
    I've co-founded <a href="https://scenesnap.co/" target='_blank'><u><i>SceneSnap</i></u></a>, 
    a B2B and B2C <b>EdTech startup </b> building an AI-powered learning ecosystem.
    <br></br><br></br>
    I'm now pursuing a Master in <b><a href="https://mtec.ethz.ch/studies.html" target="_blank">Economnics, Management & Technology</a></b> at <a href="https://ethz.ch/en.html" target="_blank"><u><i>ETHZ</i></u></a>, and working as a research assistant at <a href="https://kof.ethz.ch/it/" target="_blank"><u><i>KOF (Swiss Economic Institute)</i></u></a>.

    <br></br><br></br>
    I’m interested in how<b> numbers model money</b>: financial risk, macroeconomic forecasting, and both quantitative and personal finance
    <br></br><br></br>

    Outside work and study, you can find me  running, cycling and exploring unconventional, low-budget travel destinations.
      </p>


      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        <TotViewsClientOnly />
      </p>
    </section>
  )
}
