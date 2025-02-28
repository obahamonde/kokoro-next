"use client"
import { Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import "~/app/globals.css"
const MarkdownRenderer = ({ content, onCopy }: { content: string, onCopy: (text: string) => Promise<void> }) => {
  return (
    <div className="break-words whitespace-pre-wrap">
    <ReactMarkdown
     
      components={{
        code: ({ node, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          return match ? (
            <div className="bg-gray-800 rounded my-2 overflow-x-auto text-#cf0 w-full">
              <pre className="p-4 text-sm w-full overflow-auto">
                <code className={`${className} w-full block text-left`} {...props}>
                  {children}
                </code>
                <div className="col-end">
                  <Copy
                    className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200 cursor-pointer"
                    onClick={() => onCopy(children?.toString() || "")}
                  />
                </div>
              </pre>
            </div>
          ) : (
            <code className="bg-gray-700 px-1 py-0.5 rounded text-sm break-words" {...props}>
              {children}
            </code>
          );
        },
        p: ({ children }) => (
          <p className="mb-2 text-left break-words">{children}</p>
        ),
        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 text-left">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 text-left">{children}</ol>,
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-blue-300 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="bg-gray-700 p-4 my-4 border-l-4 border-gray-300 text-left">
            {children}
          </blockquote>
        )
      }}
    >
      {content}
    </ReactMarkdown>
</div>
  );
};

export default MarkdownRenderer