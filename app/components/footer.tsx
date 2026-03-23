import { FaInstagram, FaLinkedin, FaYoutube, FaEnvelope, FaStrava, FaRss } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="mb-4 mt-2">
    <form action="/api/newsletter" method="POST" className="mb-2 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
  
    <p className="mt-0 text-xs text-neutral-600 dark:text-neutral-400">
      Real updates. No spam.
    </p>
  

  <div className="mt-1 flex flex-col gap-2 sm:flex-row">
    <label htmlFor="newsletter-email" className="sr-only">
      Email address
    </label>
    <input
      id="newsletter-email"
      name="email"
      type="email"
      required
      autoComplete="email"
      placeholder="you@example.com"
      className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-black dark:text-neutral-100 dark:placeholder:text-neutral-500"
    />

    <button
      type="submit"
      className="rounded-md bg-neutral-900 px-4 py-1 text-sm text-neutral-50 transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
    >
      Subscribe
    </button>
  </div>

  <input
    type="text"
    name="website"
    tabIndex={-1}
    autoComplete="off"
    className="hidden"
    aria-hidden="true"
  />

  <label className="mt-2 flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
    <input
      type="checkbox"
      name="newsletter_consent"
      value="yes"
      required
      className="mt-0.4 h-3 w-3 rounded border-neutral-300 bg-transparent dark:border-neutral-700"
    />
    <span>
      I agree to receive mail updates and I have read the<a href="./privacy"> <u>Privacy Policy.</u></a> <i><b>No spam, promise you.</b></i>
    </span>
  </label>

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
    <a href="https://giacomomaggiore.com/feed.xml" target="_blank" rel="noopener noreferrer">
      <FaRss />
    </a>
  </div>
</form>

      
    </footer>
  );
}