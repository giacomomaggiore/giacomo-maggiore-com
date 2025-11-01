import Link from 'next/link'
import Image from 'next/image'
import { highlight } from 'sugar-high'
import React from 'react'
import { MDXRemote } from 'next-mdx-remote/rsc'




// katex will be imported dynamically inside CustomMDX to avoid ESM/CJS interop issues
let katexImpl: any = null

function Table({ data }) {
  // helper to render cell content with inline/display math
  function renderCellContent(cell: any, cellKey: string | number) {
    if (cell === null || cell === undefined) return null
    if (typeof cell !== 'string') return cell // leave React nodes as-is

    const text = cell as string
    const regex = /(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g
    let lastIndex = 0
    let match
    const nodes: React.ReactNode[] = []
    let idx = 0

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index))
      }

      const mathRaw = match[0]
      const isDisplay = mathRaw.startsWith('$$')
      const content = isDisplay ? mathRaw.slice(2, -2) : mathRaw.slice(1, -1)

      try {
        // try multiple access patterns to be robust vs CJS/ESM packaging
        const k = katexImpl
        const renderFn =
          (k && (k.renderToString || k.default?.renderToString)) ?? null

        if (!renderFn) {
          // if katex not available, show raw math as fallback
          throw new Error('katex render function not available')
        }

        const html = renderFn.call(k, content, {
          throwOnError: false,
          displayMode: isDisplay,
        })
        nodes.push(
          <span
            key={`math-${cellKey}-${idx++}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      } catch (e) {
        // fallback: render raw math if katex fails
        nodes.push(mathRaw)
      }

      lastIndex = regex.lastIndex
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex))
    }

    return nodes
  }

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
                  {renderCellContent(cell, `${index}-${cellIndex}`)}
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
	// helper: extract text from various node types (string, number, array, React element)
	function extractText(node: any): string {
		if (node === null || node === undefined) return ''
		if (typeof node === 'string' || typeof node === 'number') return String(node)
		if (Array.isArray(node)) return node.map(extractText).join(' ')
		if (React.isValidElement(node)) return extractText((node as any).props?.children)
		// fallback for objects or unknown types
		try {
			return String(node)
		} catch {
			return ''
		}
	}

	const text = extractText(str)

	return text
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
  // importa dinamicamente katex e salvalo in variabile di modulo
  try {
    const mod = await import('katex')
    katexImpl = mod
  } catch (err) {
    // mantiene katexImpl = null se import fallisce; Table userà fallback
    katexImpl = null
  }

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

