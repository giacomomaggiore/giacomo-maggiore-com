
import { resourceLimits } from "worker_threads";

import React from "react";

import blogList from "./lists/blogList.json";
import newsList from "./lists/newsList.json";
import podcastList from "./lists/podcastList.json";
import toolsList from "./lists/toolsList.json";
import youtubeList from "./lists/youtubeList.json";

type Resource = {
  name: string;
  link: string;
  topic: string;
};

export const metadata = {
  title: 'Resources',
  description: 'All the resources Giacomo Maggiore reads',
}

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Giacomo's Inputs</h1>
    
      <p className="mb-2">
      All the inputs and resources I consume daily, some in Italian, mostly in English.
      </p>
      <p className="mb-4">
        Feel free to reach out on <a href="https://www.instagram.com/giacomomaggiore/" target="_blank"><b>Instagram</b></a>, <a href="https://www.linkedin.com/in/giacomo-maggiore-499994263/" target="_blank"><b>Linkedin</b></a> or via <a href="mailto:giaco.maggiore@gmail.com" target="_blank"><b>Email</b></a> if you have any comments want to share your own resources!
      </p>

    
      <h1 className="semi-title">Blog</h1>
      <ul className="list-disc ml-5 mt-2 text-gray-300">
        {blogList.map((item: Resource, index: number) => (
          <li key={index}>
            <a href={item.link} target="_blank" className="text-black hover:underline">
              {item.name}
            </a>{" "}
            <span className="text-gray-400">[{item.topic}]</span>
          </li>
        ))}
      </ul>
      
      
      
      <h1 className="semi-title">Podcast</h1>
      <ul className="list-disc ml-5 mt-2 text-gray-300">
        {podcastList.map((item: Resource, index: number) => (
          <li key={index}>
            <a href={item.link} target="_blank" className="text-black hover:underline">
              {item.name}
            </a>{" "}
            <span className="text-gray-400">[{item.topic}]</span>
          </li>
        ))}
      </ul>
      <h1 className="semi-title">Newsletter</h1>
      <ul className="list-disc ml-5 mt-2 text-gray-300">
        {newsList.map((item: Resource, index: number) => (
          <li key={index}>
            <a href={item.link} target="_blank" className="text-black hover:underline">
              {item.name}
            </a>{" "}
            <span className="text-gray-400">[{item.topic}]</span>
          </li>
        ))}
      </ul>
      <h1 className="semi-title">YouTube Channels</h1>
      <ul className="list-disc ml-5 mt-2 text-gray-300">
        {youtubeList.map((item: Resource, index: number) => (
          <li key={index}>
            <a href={item.link} target="_blank" className="text-black hover:underline">
              {item.name}
            </a>{" "}
            <span className="text-gray-400">[{item.topic}]</span>
          </li>
        ))}
      </ul>


      <h1 className="semi-title">Tools</h1>
      <ul className="list-disc ml-5 mt-2 text-gray-300">
        {toolsList.map((item: Resource, index: number) => (
          <li key={index}>
            <a href={item.link} target="_blank" className="text-black hover:underline">
              {item.name}
            </a>{" "}
            <span className="text-gray-400">[{item.topic}]</span>
          </li>
        ))}
      </ul>
    </section>
 
    
  )
}
