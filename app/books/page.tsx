import bookList from "./bookList.json";

type Book = {
  title: string;
  author: string;
  topic: string;
  date: string;
  link: string;
  rating: string;
};


export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Books</h1>
    
      <p className="mb-4">
        {`Below you'll find all my input
        
        
        on books I've read, including my thoughts and reviews. I hope you find them insightful and helpful in your own reading journey.`}
      </p>
    
      <div className="list-disc ml-5 mt-2 ">
        {bookList.map((item: Book, index: number) => (
          <span key={index}>
            <p>{item.date}

            <a href={item.link} target="_blank" className="text-black font-bold hover:underline">
            {" "} {item.title} {" - "}
            </a>{" "}
             { item.author}
             </p>
          </span>
        ))}
      </div>
    
    </section>
    
  )
}
