import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send } from 'lucide-react';
import { mainInstance } from '@/07_instances/main-instance';
import MarkdownRenderer from '@/components/code/markdown-renderer';
import ReactImage from '@/components/image/react-image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await mainInstance.post('/chat', {
        message: input,
        user_id: '3',
        chat_id: chatId,
      });

      const aiMessage: Message = {
        role: 'assistant',
        content: res.data.response,
      };

      setChatId(res.data.chat_id);
      setMessages(prev => [...prev, aiMessage]);
    } catch (_err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden border-0 shadow-none">
      {/* Header */}
      <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-white/20">
            <AvatarFallback className="bg-transparent text-white">
              <Bot className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">
              Connie AI Assistant
            </h2>
            <p className="text-sm text-blue-100">Powered by advanced AI</p>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardBody className="flex-1 overflow-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Welcome to Connie AI
            </h3>
            <p className="max-w-md text-sm text-gray-500">
              Ask me anything! I'm here to help you with your questions, tasks,
              or just to have a conversation.
            </p>
            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('What can you help me with?')}
              >
                What can you help me with?
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('Tell me a fun fact')}
              >
                Tell me a fun fact
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                {msg.role === 'assistant' && (
                  <ReactImage
                    className="flex size-7 items-center justify-center overflow-hidden rounded-full border border-card outline-2 outline-primary"
                    imagePath="/images/connie-avatar.png"
                    alt="Assistant"
                    fallback="/images/default-avatar.png"
                  />
                )}

                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2.5',
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900',
                  )}
                >
                  <MarkdownRenderer text={msg.content} />
                </div>

                {msg.role === 'user' && (
                  <ReactImage
                    className="flex size-7 items-center justify-center overflow-hidden rounded-full border border-card outline-2 outline-primary"
                    imagePath="/images/default-avatar.png"
                    alt="User"
                    fallback="/images/default-avatar.png"
                  />
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600">
                  <AvatarFallback>
                    <Bot className="h-4 w-4 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl bg-gray-100 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">
                      Connie is typing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </CardBody>

      {/* Input */}
      <CardFooter className="border-t p-4">
        <div className="flex w-full gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ask Connie anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="pr-10"
            />
            {input && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
                onClick={() => setInput('')}
              >
                ✕
              </Button>
            )}
          </div>
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Send</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ChatPage;
