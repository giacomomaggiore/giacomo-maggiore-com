
export default function CVPage() {
  return (
    <div className="prose mx-auto p-4">
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Giacomo's curriculum vitae</h1>
      <iframe
        src="/cv.pdf"
        width="100%"
        height="800px"
        className="border"
        title="CV di Giacomo"
      />
    </div>
  );
}