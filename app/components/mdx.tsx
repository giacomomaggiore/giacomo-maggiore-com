import Link from 'next/link'
import Image from 'next/image'
import { highlight } from 'sugar-high'
import React from 'react'
import { MDXRemote } from 'next-mdx-remote/rsc'



function Table({ data }) {
  return (
    <div
      style={{
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          tableLayout: 'fixed', // forza le celle a ridimensionarsi per stare nel contenitore
          wordWrap: 'break-word', // evita parole troppo lunghe
          fontSize: '0.95rem',
          margin: '1rem 0',
        }}
      >
        <thead style={{ backgroundColor: '#f7f7f7' }}>
          <tr>
            {data.headers.map((header, index) => (
              <th
                key={index}
                style={{
                  border: '1px solid black',
                  padding: '8px 10px',
                  textAlign: 'left',
                  fontWeight: 600,
                  whiteSpace: 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{
                    border: '1px solid black',
                    padding: '8px 10px',
                    verticalAlign: 'top',
                    whiteSpace: 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}





function CustomLink(props) {
  let href = props.href

  if (href.startsWith('/')) {
    return (
      <Link href={href} {...props}>
        {props.children}
      </Link>
    )
  }

  if (href.startsWith('#')) {
    return <a {...props} />
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />
}

function RoundedImage(props) {
  return <Image alt={props.alt} className="rounded-lg" {...props} />
}

function Code({ children, ...props }) {
  let codeHTML = highlight(children)
  return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />
}

function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters except for -
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
}

function createHeading(level) {
  const Heading = ({ children }) => {
    let slug = slugify(children)
    return React.createElement(
      `h${level}`,
      { id: slug },
      [
        React.createElement('a', {
          href: `#${slug}`,
          key: `link-${slug}`,
          className: 'anchor',
        }),
      ],
      children
    )
  }

  Heading.displayName = `Heading${level}`

  return Heading
}

function Quote({ children }) {
  return (
    <blockquote
      style={{
        borderLeft: '4px solid #ccc',
        margin: '1em 0',
        padding: '0.5em 1em',
        color: '#555',
        background: '#fafafa',
        fontStyle: 'italic',
      }}
    >
      {children}
    </blockquote>
  )
}

let components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  Image: RoundedImage,
  a: CustomLink,
  code: Code,
  Table,
  Quote
}




interface CustomMDXProps {
  source: string
}

export async function CustomMDX({ source }: CustomMDXProps) {
  // Import dinamici per evitare problemi di compatibilità
  const [{ default: remarkMath }, { default: rehypeKatex }] = await Promise.all([
    import('remark-math'),
    import('rehype-katex')
  ])

  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkMath],
          rehypePlugins: [
            [rehypeKatex as any, {
              strict: false,
              throwOnError: false,
              trust: true,
              output: 'html'
            }]
          ],
        },
      }}
    />
  )
}