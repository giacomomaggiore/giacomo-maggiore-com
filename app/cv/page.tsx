import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import ReactMarkdown from 'react-markdown';

export const metadata = {
  title: 'Giacomo Maggiore CV',
  description: 'curriculum vitae',
}

export default async function Page() {
  // Legge il PDF dal server
  const filePath = path.join(process.cwd(), 'public', 'cv.pdf');
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdf(dataBuffer);

  const cvText = pdfData.text; // testo puro
  const markdown = cvText; // qui puoi aggiungere # o ** per titoli/grassetto se vuoi

  return (
    <section className="prose mx-auto p-4">
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Giacomo's Curriculum Vitae</h1>
      
      {/* Render Markdown */}
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </section>
  )
}