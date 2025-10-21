import { FaInstagram, FaLinkedin, FaYoutube, FaEnvelope, FaStrava, FaRss } from "react-icons/fa";



  export default function Footer() {
  // Costruisci l'URL RSS usando la lingua passata

  return (
    <footer className="mb-10">
      <div className="flex gap-3 text-xl mt-4">
      
      <a href="mailto:giaco.maggiore@gmail.com" target="_blank" rel="noopener noreferrer">
        <FaEnvelope />
      </a>
      <a href="https://www.instagram.com/giacomomaggiore/" target="_blank" rel="noopener noreferrer">
        <FaInstagram />
      </a>
      <a href="https://www.linkedin.com/in/giacomo-maggiore-499994263/" target="_blank" rel="noopener noreferrer">
        <FaLinkedin />
      </a>
      <a href="https://www.youtube.com/@giacomomaggiore01" target="_blank" rel="noopener noreferrer">
        <FaYoutube />
      </a>
      <a href="https://www.strava.com/athletes/24804406" target="_blank" rel="noopener noreferrer">
        <FaStrava />
      </a>
      <a href= "https://giacomomaggiore.com/feed.xml" target="_blank" rel="noopener noreferrer">
        <FaRss />
      </a>
      
      
    </div>
    </footer>
  )
}
