import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Bot,
  History,
  Loader2,
  Paperclip,
  PlusCircle,
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

// Define the expected message structure from backend
type BackendMessage = {
  role: 'user' | 'assistant';
  content: string;
  suggested_actions?: string[];
  // Add any other fields that might be present
  [key: string]: unknown;
};

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

  // Dialog states
  const [deleteChatDialogOpen, setDeleteChatDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<ChatHistoryItem | null>(
    null,
  );

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load chat history on mount
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
    } catch (_err) {
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

  const handleDeleteAllClick = () => {
    setDeleteAllDialogOpen(true);
  };

  // Callback functions for the dialogs
  const handleChatDeleted = () => {
    fetchHistory(); // Refresh the history list
  };

  const handleSingleChatDeleted = (deletedChatId: number) => {
    if (chatId === deletedChatId) {
      startNewChat(); // Start new chat if the current one was deleted
    }
  };

  const handleAllChatsDeleted = () => {
    startNewChat(); // Start new chat when all chats are deleted
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Auto-resize textarea with max height
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

      // Update history intelligently
      if (isNewChat && res.data.title) {
        // New chat was created, add it to history
        const newChatItem: ChatHistoryItem = {
          id: newChatId,
          title: res.data.title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        addToHistory(newChatItem);
      } else if (res.data.title) {
        // Existing chat, update its title if changed
        updateHistoryItem({ id: newChatId, title: res.data.title });
      }
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

      // FIX: Ensure messages are properly formatted and only extract role and content
      const formattedMessages = (res.data.messages || []).map(
        (msg: BackendMessage) => ({
          role: msg.role,
          content:
            typeof msg.content === 'string' ? msg.content : String(msg.content),
          // Preserve suggested_actions if they exist
          suggestedActions: msg.suggested_actions,
        }),
      );

      setMessages(formattedMessages);
    } catch (_err) {
      console.error('Failed to load chat', _err);
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
    setIsSidebarOpen(!isSidebarOpen);
    if (!isSidebarOpen) {
      fetchHistory();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border bg-card">
      {/* Top Navigation / Header */}
      <header className="flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={isSidebarOpen}
          >
            <History size={16} />
          </Button>
          <span className="font-semibold tracking-tight">Ask Connie</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={startNewChat}>
            <PlusCircle size={16} />
            New Chat
          </Button>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* History Sidebar */}
        <aside
          className={`w-80 shrink-0 border-r bg-card transition-all duration-300 ${
            isSidebarOpen ? 'ml-0' : '-ml-80'
          }`}
          aria-label="Chat history sidebar"
        >
          {/* Header Section */}
          <div className="flex h-14 items-center justify-between border-b px-4">
            <h3 className="font-semibold">Chat History</h3>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteAllClick}
                  className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash size={16} className="mr-2" />
                  Delete All
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </Button>
            </div>
          </div>

          {/* Chat History List */}
          <div
            className="overflow-y-auto p-2"
            style={{ height: 'calc(100% - 56px)' }}
          >
            <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
              Recent Chats
            </p>
            <div className="space-y-1">
              {loadingHistory ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No chat history yet.
                </div>
              ) : (
                history.map(chat => (
                  <div
                    key={chat.id}
                    className={`group relative w-full rounded-lg ${
                      chatId === chat.id ? 'bg-accent' : ''
                    }`}
                  >
                    <button
                      onClick={() => loadChat(chat)}
                      className="w-full px-3 py-2.5 text-left"
                      disabled={isLoadingChat}
                    >
                      <div className="pr-8 font-medium">{chat.title}</div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                      onClick={e => handleDeleteChatClick(chat, e)}
                      disabled={_setDeletingChatId === chat.id || isLoadingChat}
                    >
                      {_setDeletingChatId === chat.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Message Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-8">
            {isLoadingChat ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm">Loading conversation...</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="mt-20 flex flex-col items-center text-center">
                <h1 className="mb-8 text-4xl font-medium tracking-tight">
                  Good morning, User.
                </h1>
                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    'Tell me about Connext',
                    'How to file a PTO',
                    'Help me code',
                    'Brainstorm ideas',
                  ].map((item, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(item)}
                      className="flex items-center rounded-xl border bg-card p-4 text-sm hover:border-muted-foreground hover:bg-accent"
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
                          ? 'rounded-2xl bg-muted px-5 py-3'
                          : 'w-full',
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="mb-2 flex items-center gap-2 font-medium text-muted-foreground">
                          <Bot size={16} /> Connie
                        </div>
                      )}
                      {/* FIX: Ensure content is always a string */}
                      <MarkdownRenderer
                        text={
                          typeof msg.content === 'string'
                            ? msg.content
                            : String(msg.content)
                        }
                      />
                    </div>

                    {/* Suggested Actions */}
                    {msg.suggestedActions &&
                      msg.suggestedActions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {msg.suggestedActions.map(action => (
                            <Button
                              key={action}
                              variant="outline"
                              size="sm"
                              className="rounded-full text-xs"
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
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm italic">Thinking...</span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2 rounded-2xl border p-2 shadow-sm focus-within:border-primary focus-within:shadow-md">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
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
              className="min-h-[40px] w-full resize-none border-0 bg-transparent p-0 py-2.5 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{
                overflow: 'hidden',
                maxHeight: '200px',
              }}
            />
            <Button
              size="icon"
              disabled={isSending || !input.trim() || isLoadingChat}
              onClick={() => sendMessage(input)}
              className={cn(
                'h-10 w-10 shrink-0 rounded-xl',
                input.trim() && !isSending && !isLoadingChat
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <ArrowUp size={20} />
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Connie can make mistakes. Please check important info.
          </p>
        </div>
      </div>

      {/* Delete Single Chat Dialog */}
      <DeleteChatDialog
        open={deleteChatDialogOpen}
        setOpen={setDeleteChatDialogOpen}
        chatToDelete={chatToDelete}
        onDelete={handleChatDeleted}
        chatId={chatId}
        onChatDeleted={handleSingleChatDeleted}
      />

      {/* Delete All Chats Dialog */}
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
