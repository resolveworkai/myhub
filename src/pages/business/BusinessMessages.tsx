import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Star,
  Archive,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender: "user" | "member";
  timestamp: Date;
}

interface Conversation {
  id: string;
  memberName: string;
  memberEmail: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unread: number;
  messages: Message[];
}

const initialConversations: Conversation[] = [
  {
    id: "c1",
    memberName: "Rahul Sharma",
    memberEmail: "rahul@email.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    lastMessage: "Thanks for the session update!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
    unread: 2,
    messages: [
      { id: "m1", content: "Hi, I wanted to ask about my upcoming session", sender: "member", timestamp: new Date(Date.now() - 1000 * 60 * 30) },
      { id: "m2", content: "Sure! Your session is scheduled for tomorrow at 9 AM with Coach Arun", sender: "user", timestamp: new Date(Date.now() - 1000 * 60 * 25) },
      { id: "m3", content: "Thanks for the session update!", sender: "member", timestamp: new Date(Date.now() - 1000 * 60 * 5) },
      { id: "m4", content: "Can I also book an extra slot this week?", sender: "member", timestamp: new Date(Date.now() - 1000 * 60 * 4) },
    ],
  },
  {
    id: "c2",
    memberName: "Priya Patel",
    memberEmail: "priya@email.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    lastMessage: "Is the yoga class still on?",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60),
    unread: 1,
    messages: [
      { id: "m1", content: "Is the yoga class still on?", sender: "member", timestamp: new Date(Date.now() - 1000 * 60 * 60) },
    ],
  },
  {
    id: "c3",
    memberName: "Amit Kumar",
    memberEmail: "amit@email.com",
    lastMessage: "Payment confirmed",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 3),
    unread: 0,
    messages: [
      { id: "m1", content: "I've made the payment for renewal", sender: "member", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) },
      { id: "m2", content: "Payment confirmed. Your membership is extended till March 2026", sender: "user", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3) },
    ],
  },
  {
    id: "c4",
    memberName: "Sneha Gupta",
    memberEmail: "sneha@email.com",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    lastMessage: "See you tomorrow!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unread: 0,
    messages: [
      { id: "m1", content: "Just confirming my PT session tomorrow", sender: "member", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25) },
      { id: "m2", content: "Confirmed! 8 AM with Coach Meera", sender: "user", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24.5) },
      { id: "m3", content: "See you tomorrow!", sender: "member", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    ],
  },
];

export default function BusinessMessages() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const filteredConversations = conversations.filter((c) =>
    c.memberName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    // Mark as read
    setConversations(conversations.map((c) => c.id === id ? { ...c, unread: 0 } : c));
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedId) return;
    
    const message: Message = {
      id: `m${Date.now()}`,
      content: newMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setConversations(conversations.map((c) => c.id === selectedId ? {
      ...c,
      messages: [...c.messages, message],
      lastMessage: newMessage,
      lastMessageTime: new Date(),
    } : c));

    setNewMessage("");
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            {totalUnread > 0 ? `${totalUnread} unread messages` : "All caught up!"}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100%-4rem)]">
        {/* Conversations List */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(100%-5rem)]">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={cn(
                  "w-full p-4 flex items-start gap-3 border-b border-border hover:bg-muted/50 transition-colors text-left",
                  selectedId === conv.id && "bg-muted"
                )}
              >
                <Avatar>
                  <AvatarImage src={conv.avatar} />
                  <AvatarFallback>{conv.memberName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{conv.memberName}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(conv.lastMessageTime)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <Badge variant="default" className="rounded-full h-5 w-5 p-0 flex items-center justify-center">
                    {conv.unread}
                  </Badge>
                )}
              </button>
            ))}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.avatar} />
                    <AvatarFallback>{selectedConversation.memberName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedConversation.memberName}</div>
                    <div className="text-sm text-muted-foreground">{selectedConversation.memberEmail}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Star className="h-4 w-4 mr-2" /> Star</DropdownMenuItem>
                      <DropdownMenuItem><Archive className="h-4 w-4 mr-2" /> Archive</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          msg.sender === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={cn(
                          "text-xs mt-1",
                          msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
