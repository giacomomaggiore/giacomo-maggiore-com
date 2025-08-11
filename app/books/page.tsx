import bookList from "./bookList.json";

type Book = {
  title: string;
  author: string;
  topic: string;
  date: string;
  link: string;
  rating: string;
};

export const metadata = {
  title: 'Books',
  description: 'All the books Giacomo Maggiore reads',
}

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Giacomo's Library</h1>
    
      <p className="mb-2">
      All the the books I've read in the last years, some in Italian, mostly in English.
      </p>
      <p className="mb-4">
        Feel free to reach out on <a href="https://www.instagram.com/giacomomaggiore/" target="_blank"><b>Instagram</b></a> , <a href="https://www.linkedin.com/in/giacomo-maggiore-499994263/" target="_blank"><b>Linkedin</b></a> or via <a href="mailto:giaco.maggiore@gmail.com" target="_blank"><b>Email</b></a> if you have any comments want to share your favourite readings.
      </p>
    
      <div className="flex flex-col gap-2 ml-5 mt-2">
  {bookList.map((item: Book, index: number) => (
    <div
      key={index}
      className="overflow-x-auto whitespace-nowrap no-scrollbar">
      {item.date}
      <a
        href={item.link}
        target="_blank"
        className="text-black font-bold hover:underline"
      >
        {" "}{item.title}
      </a>{" - "}
      {item.author}
    </div>
  ))}
</div>
    
    </section>
    
  )
}
