import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        components={{
          a: ({ node, ...props }) => <a {...props} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer" />,
          ul: ({ node, ...props }) => <ul {...props} className="list-disc list-outside ml-4 my-2" />,
          ol: ({ node, ...props }) => <ol {...props} className="list-decimal list-outside ml-4 my-2" />,
          h1: ({ node, ...props }) => <h1 {...props} className="text-xl font-bold mt-4 mb-2 text-white" />,
          h2: ({ node, ...props }) => <h2 {...props} className="text-lg font-bold mt-3 mb-2 text-gray-100" />,
          p: ({ node, ...props }) => <p {...props} className="my-2 leading-relaxed text-gray-300" />,
          strong: ({ node, ...props }) => <strong {...props} className="font-semibold text-white" />,
          blockquote: ({ node, ...props }) => <blockquote {...props} className="border-l-4 border-gray-600 pl-4 italic text-gray-400 my-2" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};