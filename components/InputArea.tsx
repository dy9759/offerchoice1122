import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Loader2 } from 'lucide-react';
import { Attachment } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
  disclaimerText?: string;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, disabled, placeholder, disclaimerText }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments: Attachment[] = [];
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const reader = new FileReader();

        reader.onload = (event) => {
           const result = event.target?.result as string;
           const type = file.type.startsWith('image/') ? 'image' : 'text';
           
           newAttachments.push({
             type: type,
             content: result,
             mimeType: file.type,
             name: file.name
           });

           if (newAttachments.length === e.target.files!.length) {
             setAttachments(prev => [...prev, ...newAttachments]);
           }
        };
        
        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
        } else {
            // Attempt to read as text for simple doc parsing simulation
            reader.readAsText(file);
        }
      }
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if ((!text.trim() && attachments.length === 0) || disabled) return;
    onSend(text, attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 pb-6">
      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto pb-2 px-1 scrollbar-hide">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative flex items-center justify-center w-16 h-16 bg-zinc-800 rounded-lg border border-zinc-700 flex-shrink-0 group overflow-hidden">
              {att.type === 'image' ? (
                <img src={att.content} alt="preview" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
              ) : (
                <span className="text-xs text-gray-400 text-center px-1 break-all">{att.name.slice(0, 10)}...</span>
              )}
              <button 
                onClick={() => removeAttachment(idx)}
                className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white hover:bg-red-500 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-end bg-zinc-900/90 border border-white/10 rounded-3xl shadow-2xl p-2 backdrop-blur-md ring-1 ring-white/5 focus-within:ring-indigo-500/50 transition-all">
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
          disabled={disabled}
        >
          <Paperclip size={20} />
        </button>
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileSelect}
          accept="image/*,text/plain,.txt,.md,.pdf" 
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Type a message..."}
          className="flex-1 bg-transparent border-none focus:ring-0 text-gray-100 placeholder-gray-500 resize-none py-3 px-2 max-h-40 min-h-[44px] scrollbar-hide"
          disabled={disabled}
          rows={1}
        />

        <button 
          onClick={handleSubmit}
          disabled={disabled || (!text.trim() && attachments.length === 0)}
          className={`p-3 rounded-full transition-all duration-200 ${
             disabled || (!text.trim() && attachments.length === 0)
             ? 'bg-zinc-800 text-zinc-600'
             : 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 hover:scale-105'
          }`}
        >
          {disabled ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>
      <div className="text-center mt-2 text-[10px] text-gray-600 font-medium">
        {disclaimerText || "JobChoice can make mistakes. Please verify important career information."}
      </div>
    </div>
  );
};

export default InputArea;