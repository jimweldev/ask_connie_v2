import ReactMarkdown, { type Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const MarkdownRenderer = ({ text }: { text: string }) => {
  const components: Components = {
    h1: ({ children }) => (
      <h1 className="mt-4 mb-3 text-xl font-bold last:mb-0">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-3 mb-2 text-lg font-semibold last:mb-0">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-3 mb-2 font-semibold last:mb-0">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mb-3 leading-relaxed last:mb-0">{children}</p>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold last:mb-0">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => (
      <ul className="mb-3 ml-6 list-disc space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 ml-6 list-decimal space-y-1">{children}</ol>
    ),
    li: ({ children }) => {
      const hasNestedList =
        Array.isArray(children) &&
        children.some(
          child =>
            typeof child === 'object' &&
            child !== null &&
            'type' in child &&
            (child.type === 'ul' || child.type === 'ol'),
        );

      return (
        <li className={`${hasNestedList ? 'mb-2' : ''} pl-1`}>{children}</li>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="my-3 border-l-4 border-gray-300 pl-4 italic last:mb-0">
        {children}
      </blockquote>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- missing types
    code: ({ inline, children, ...props }: any) => {
      // Check if this is a file path (contains slashes or file extension)
      const content = String(children).replace(/\n$/, '');
      const isFilePath =
        /[/\\]|\.(pdf|docx?|txt|md|jpg|png|json|xml|html?|css|js|php)$/i.test(
          content,
        );

      if (inline) {
        if (isFilePath) {
          // Style file paths differently
          return (
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-blue-600 dark:bg-gray-800 dark:text-blue-400">
              📄 {content}
            </code>
          );
        }
        return (
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm">
            {children}
          </code>
        );
      }

      // For block code, detect if it's a file path
      if (isFilePath && !content.includes('\n')) {
        return (
          <div className="my-2 rounded-lg bg-gray-50 p-3 font-mono text-sm dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">📁</span>
              <code className="text-blue-600 dark:text-blue-400">
                {content}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(content)}
                className="ml-auto text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Copy path"
              >
                Copy
              </button>
            </div>
          </div>
        );
      }

      return (
        <code
          className="block overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-sm"
          {...props}
        >
          {children}
        </code>
      );
    },
    a: ({ children, href }) => {
      // Check if it's a file link (pdf, docx, etc.)
      const isFileLink =
        /\.(pdf|docx?|txt|md|jpg|png|json|xml|html?|css|js|php)$/i.test(
          href || '',
        );
      const isFilePath = !href?.startsWith('http') && href?.includes('/');

      return (
        <a
          href={href}
          className={`inline-flex items-center gap-1 ${
            isFileLink || isFilePath
              ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
              : 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
          } underline hover:no-underline`}
          target={isFilePath ? '_self' : '_blank'}
          rel={isFilePath ? undefined : 'noopener noreferrer'}
          onClick={e => {
            if (isFilePath && href) {
              e.preventDefault();
              // You can implement file download or preview here
              console.log('File path clicked:', href);
              // window.open(href, '_blank');
            }
          }}
        >
          {isFileLink || isFilePath ? (
            <>
              <span>📄</span>
              {children}
            </>
          ) : (
            children
          )}
        </a>
      );
    },
    hr: () => <hr className="my-4 border-gray-300" />,
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
    tbody: ({ children }) => (
      <tbody className="divide-y divide-gray-200">{children}</tbody>
    ),
    tr: ({ children }) => <tr>{children}</tr>,
    th: ({ children }) => (
      <th className="px-4 py-2 text-left text-sm font-semibold">{children}</th>
    ),
    td: ({ children }) => <td className="px-4 py-2 text-sm">{children}</td>,
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={components}
    >
      {text}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
