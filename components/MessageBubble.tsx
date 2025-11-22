import React from 'react';
import { Message, Sender } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Bot, User, ExternalLink } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.USER;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-indigo-600' : 'bg-emerald-600/20 border border-emerald-500/30'}`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-emerald-400" />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-5 py-3.5 rounded-2xl shadow-sm backdrop-blur-sm ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-zinc-900/80 border border-white/10 text-gray-200 rounded-tl-none'
          }`}>
             {message.isThinking ? (
                <div className="flex items-center space-x-2">
                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
             ) : (
                 <>
                  <MarkdownRenderer content={message.text} />
                  
                  {/* Attachments Display */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.attachments.map((att, idx) => (
                        <div key={idx} className="text-xs bg-black/30 px-2 py-1 rounded border border-white/10 flex items-center text-gray-300">
                           {att.type === 'image' ? '📸 Image' : '📄 Document'}
                        </div>
                      ))}
                    </div>
                  )}
                 </>
             )}
          </div>

          {/* Grounding / Sources */}
          {!isUser && message.groundingMetadata?.groundingChunks && (
            <div className="mt-2 p-2 bg-black/40 rounded-lg border border-white/5 max-w-full">
              <div className="text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                <ExternalLink size={10} /> Sources
              </div>
              <div className="flex flex-wrap gap-2">
                {message.groundingMetadata.groundingChunks.map((chunk, idx) => (
                  chunk.web?.uri && (
                    <a 
                      key={idx} 
                      href={chunk.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded-full text-blue-300 truncate max-w-[200px] border border-white/5 transition-colors"
                    >
                      {chunk.web.title || new URL(chunk.web.uri).hostname}
                    </a>
                  )
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MessageBubble;