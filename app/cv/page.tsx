
export default function CVPage() {
  return (
    <div className="prose mx-auto p-4">
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Giacomo's Curriculum Vitae</h1>
      <iframe
        src="/cv_giacomo_maggiore.pdf"
        width="100%"
        height="800px"
        className="border"
        title="Giacomo's Curriculum Vitae"
      />
    </div>
  );
}