import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Bot, Loader2, Paperclip } from 'lucide-react';
import { mainInstance } from '@/07_instances/main-instance';
import MarkdownRenderer from '@/components/code/markdown-renderer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // Switched to Textarea for Claude feel
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  suggestedActions?: string[];
};

type ChatResponse = {
  response: string;
  chat_id: number;
  suggested_actions?: string[];
};

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await mainInstance.post<ChatResponse>('/chat', {
        message: messageText,
        user_id: '3',
        chat_id: chatId,
      });

      setChatId(res.data.chat_id);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.response,
          suggestedActions: res.data.suggested_actions,
        },
      ]);
    } catch (_err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I encountered an error. Please try again.',
          suggestedActions: ['Try Again'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-md border bg-card">
      {/* Top Navigation / Header */}
      <header className="flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight text-gray-800">
            Ask Connie
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-gray-500">
            History
          </Button>
        </div>
      </header>

      {/* Message Area */}
      <main className="relative flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {messages.length === 0 ? (
            <div className="mt-20 flex flex-col items-center text-center">
              <h1 className="mb-8 text-4xl font-medium tracking-tight text-gray-800">
                Good morning, User.
              </h1>
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  'Tell me about Connext',
                  'How to file a PTO',
                  'Help me code',
                  'Brainstorm ideas',
                ].map(item => (
                  <button
                    key={item}
                    onClick={() => sendMessage(item)}
                    className="transition-hover flex items-center rounded-xl border border-gray-200 bg-white p-4 text-sm hover:border-gray-300 hover:bg-gray-50"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 pb-32">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex flex-col gap-3',
                    msg.role === 'user' ? 'items-end' : 'items-start',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] px-1 text-base leading-relaxed',
                      msg.role === 'user'
                        ? 'rounded-2xl bg-[#f0f0ee] px-5 py-3 text-gray-800'
                        : 'w-full text-gray-900',
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="mb-2 flex items-center gap-2 font-medium text-gray-500">
                        <Bot size={16} /> Connie
                      </div>
                    )}
                    <MarkdownRenderer text={msg.content} />
                  </div>

                  {/* Suggested Actions */}
                  {msg.suggestedActions && (
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestedActions.map(action => (
                        <Button
                          key={action}
                          variant="outline"
                          size="sm"
                          className="rounded-full border-gray-300 text-xs text-gray-600 hover:bg-gray-100"
                          onClick={() => sendMessage(action)}
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm italic">Thinking...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </main>

      {/* Floating Input Area */}
      <div className="pb-6">
        <div className="mx-auto max-w-3xl px-4 py-2">
          <div className="relative flex items-end gap-2 rounded-2xl border border-gray-300 p-2 shadow-sm focus-within:border-gray-400">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-gray-400 hover:text-gray-600"
            >
              <Paperclip size={20} />
            </Button>
            <Textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Connie..."
              className="min-h-[40px] w-full resize-none border-0 bg-transparent py-2.5 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              size="icon"
              disabled={loading || !input.trim()}
              onClick={() => sendMessage(input)}
              className={cn(
                'h-10 w-10 shrink-0 rounded-xl transition-all',
                input.trim()
                  ? 'bg-[#d97757] text-white hover:bg-[#c46648]'
                  : 'bg-gray-100 text-gray-400',
              )}
            >
              <ArrowUp size={20} />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Connie can make mistakes. Please check important info.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
