import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Bot,
  History,
  Loader2,
  Paperclip,
  PlusCircle,
  Sparkles,
  Trash,
  Trash2,
  X,
} from 'lucide-react';
import { mainInstance } from '@/07_instances/main-instance';
import MarkdownRenderer from '@/components/code/markdown-renderer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import DeleteAllChatsDialog from './_dialogs/delete-all-chats-dialog';
import DeleteChatDialog from './_dialogs/delete-chat-dialog';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  suggestedActions?: string[];
};

type ChatResponse = {
  response: string;
  chat_id: number;
  suggested_actions?: string[];
  title?: string;
};

type ChatHistoryItem = {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
};

type BackendMessage = {
  role: 'user' | 'assistant';
  content: string;
  suggested_actions?: string[];
  [key: string]: unknown;
};

const QUICK_PROMPTS = [
  { label: 'Tell me about Connext', icon: '🏢' },
  { label: 'How to file a PTO', icon: '📅' },
  { label: 'Help me with a ticket', icon: '🎫' },
  { label: 'Payroll questions', icon: '💼' },
];

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [_setDeletingChatId, _] = useState<number | null>(null);

  const [deleteChatDialogOpen, setDeleteChatDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<ChatHistoryItem | null>(
    null,
  );

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await mainInstance.get('/chat/history', {
        params: { external_user_id: '1', app_source: 'default' },
      });
      setHistory(res.data.chats || []);
    } catch {
      console.error('Failed to fetch history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const updateHistoryItem = (updatedChat: { id: number; title: string }) => {
    setHistory(prev =>
      prev.map(chat =>
        chat.id === updatedChat.id
          ? {
              ...chat,
              title: updatedChat.title,
              updated_at: new Date().toISOString(),
            }
          : chat,
      ),
    );
  };

  const addToHistory = (newChat: ChatHistoryItem) => {
    setHistory(prev => [newChat, ...prev]);
  };

  const handleDeleteChatClick = (
    chat: ChatHistoryItem,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setChatToDelete(chat);
    setDeleteChatDialogOpen(true);
  };

  const handleDeleteAllClick = () => setDeleteAllDialogOpen(true);
  const handleChatDeleted = () => fetchHistory();
  const handleSingleChatDeleted = (deletedChatId: number) => {
    if (chatId === deletedChatId) startNewChat();
  };
  const handleAllChatsDeleted = () => startNewChat();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textareaRef.current.style.overflowY =
        scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [input]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isSending) return;
    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    try {
      const res = await mainInstance.post<ChatResponse>('/chat', {
        message: messageText,
        external_user_id: '1',
        website: 'CoT',
        chat_id: chatId,
      });
      const newChatId = res.data.chat_id;
      const isNewChat = !chatId;
      setChatId(newChatId);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.response,
          suggestedActions: res.data.suggested_actions,
        },
      ]);
      if (isNewChat && res.data.title) {
        addToHistory({
          id: newChatId,
          title: res.data.title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else if (res.data.title) {
        updateHistoryItem({ id: newChatId, title: res.data.title });
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I encountered an error. Please try again.',
          suggestedActions: ['Try Again'],
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const loadChat = async (chat: ChatHistoryItem) => {
    try {
      setIsLoadingChat(true);
      const res = await mainInstance.get(`/chat/${chat.id}/messages`, {
        params: { external_user_id: '1', app_source: 'default' },
      });
      setChatId(res.data.chat_id);
      setMessages(
        (res.data.messages || []).map((msg: BackendMessage) => ({
          role: msg.role,
          content:
            typeof msg.content === 'string' ? msg.content : String(msg.content),
          suggestedActions: msg.suggested_actions,
        })),
      );
    } catch (err) {
      console.error('Failed to load chat', err);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setChatId(null);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
    if (!isSidebarOpen) fetchHistory();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card/80 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={isSidebarOpen}
            className={cn(
              'h-9 w-9 rounded-lg',
              isSidebarOpen && 'bg-accent text-accent-foreground',
            )}
          >
            <History size={16} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles size={14} className="text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Ask Connie
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={startNewChat}
          className="h-8 gap-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <PlusCircle size={14} />
          New Chat
        </Button>
      </header>

      {/* Body */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            'shrink-0 overflow-hidden border-r bg-muted/30',
            isSidebarOpen ? 'w-72' : 'w-0',
          )}
          style={{ transition: 'width 300ms ease' }}
          aria-label="Chat history sidebar"
        >
          <div className="flex h-full w-72 flex-col">
            {/* Sidebar header */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
              <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                History
              </span>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteAllClick}
                    className="h-7 w-7 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Delete all"
                  >
                    <Trash />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-7 w-7 rounded-md text-muted-foreground"
                  aria-label="Close sidebar"
                >
                  <X />
                </Button>
              </div>
            </div>

            {/* Sidebar list */}
            <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  <span className="text-xs">Loading…</span>
                </div>
              ) : history.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-xs text-muted-foreground">No chats yet.</p>
                </div>
              ) : (
                history.map(chat => (
                  <div
                    key={chat.id}
                    className={cn(
                      'group relative flex cursor-pointer items-center rounded-lg',
                      chatId === chat.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-accent',
                    )}
                  >
                    <button
                      onClick={() => loadChat(chat)}
                      disabled={isLoadingChat}
                      className="min-w-0 flex-1 px-3 py-2 text-left"
                    >
                      <p className="truncate pr-6 text-xs leading-relaxed font-medium">
                        {chat.title}
                      </p>
                    </button>
                    {!isLoadingChat && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 h-6 w-6 shrink-0 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                        onClick={e => handleDeleteChatClick(chat, e)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main messages area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-6">
            {isLoadingChat ? (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs">Loading conversation…</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              /* Empty state */
              <div className="mt-16 flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <Sparkles size={24} className="text-primary" />
                </div>
                <h1 className="mb-1 text-2xl font-semibold tracking-tight">
                  Hi, I'm Connie
                </h1>
                <p className="mb-8 text-sm text-muted-foreground">
                  Your Connext assistant. Ask me anything.
                </p>
                <div className="grid w-full grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map(item => (
                    <button
                      key={item.label}
                      onClick={() => sendMessage(item.label)}
                      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm transition-colors hover:border-border/80 hover:bg-accent"
                    >
                      <span className="text-base leading-none">
                        {item.icon}
                      </span>
                      <span className="font-medium text-foreground/80">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages */
              <div className="space-y-6 pb-36">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex flex-col gap-2',
                      msg.role === 'user' ? 'items-end' : 'items-start',
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="ml-1 flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                          <Bot size={11} className="text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">
                          Connie
                        </span>
                      </div>
                    )}

                    <div
                      className={cn(
                        'text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground'
                          : 'w-full rounded-2xl rounded-tl-sm border border-border/50 bg-muted/60 px-4 py-3',
                      )}
                    >
                      <MarkdownRenderer
                        text={
                          typeof msg.content === 'string'
                            ? msg.content
                            : String(msg.content)
                        }
                      />
                    </div>

                    {msg.suggestedActions &&
                      msg.suggestedActions.length > 0 && (
                        <div className="ml-1 flex flex-wrap gap-1.5">
                          {msg.suggestedActions.map(action => (
                            <Button
                              key={action}
                              variant="outline"
                              size="sm"
                              className="h-7 rounded-full border-border/60 px-3 text-xs font-medium hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                              onClick={() => sendMessage(action)}
                            >
                              {action}
                            </Button>
                          ))}
                        </div>
                      )}
                  </div>
                ))}

                {isSending && (
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                      <Bot size={11} className="text-primary" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-border/50 bg-muted/60 px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t bg-card/80 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          <div
            className={cn(
              'flex items-end gap-2 rounded-2xl border bg-background px-3 py-2 shadow-sm',
              'focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10',
              'transition-shadow',
            )}
          >
            <Button
              size="icon"
              variant="ghost"
              className="mb-0.5 h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Paperclip size={16} />
            </Button>
            <Textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Connie…"
              className="min-h-[36px] w-full resize-none border-0 bg-transparent p-0 py-2 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ overflow: 'hidden', maxHeight: '200px' }}
            />
            <Button
              size="icon"
              disabled={isSending || !input.trim() || isLoadingChat}
              onClick={() => sendMessage(input)}
              className={cn(
                'mb-0.5 h-8 w-8 shrink-0 rounded-xl transition-colors',
                input.trim() && !isSending && !isLoadingChat
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'cursor-not-allowed bg-muted text-muted-foreground',
              )}
            >
              {isSending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ArrowUp size={16} />
              )}
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
            Connie can make mistakes. Please verify important information.
          </p>
        </div>
      </div>

      <DeleteChatDialog
        open={deleteChatDialogOpen}
        setOpen={setDeleteChatDialogOpen}
        chatToDelete={chatToDelete}
        onDelete={handleChatDeleted}
        chatId={chatId}
        onChatDeleted={handleSingleChatDeleted}
      />
      <DeleteAllChatsDialog
        open={deleteAllDialogOpen}
        setOpen={setDeleteAllDialogOpen}
        historyLength={history.length}
        onDeleteAll={handleChatDeleted}
        onAllChatsDeleted={handleAllChatsDeleted}
      />
    </div>
  );
};

export default ChatPage;
