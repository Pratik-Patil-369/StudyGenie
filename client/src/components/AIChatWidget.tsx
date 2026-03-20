import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react'
import Markdown from 'react-markdown'
import { apiPost } from '../utils/api'
import { cn } from '@/lib/utils'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
}

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: "Hi! I'm StudyGenie, your AI tutor. Ask me anything about your studies, need explanation on a topic, or want some tips!" }
    ])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    useEffect(() => { scrollToBottom() }, [messages, isOpen])

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputValue.trim() }
        setMessages(prev => [...prev, userMsg])
        setInputValue('')
        setIsLoading(true)
        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }))
            const response = await apiPost('/chat', { message: userMsg.content, history })
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: response.response || "Sorry, I couldn't formulate a response." }])
        } catch (error) {
            console.error('Chat Error:', error)
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: "Oops! I ran into a problem connecting to my brain. Please try again later." }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() }
    }

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[350px] h-[500px] max-sm:w-[calc(100vw-32px)] max-sm:h-[60vh] bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
                                <Bot className="h-[18px] w-[18px] text-primary-foreground" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold">StudyGenie AI</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-mastered inline-block" />
                                    <span className="text-xs text-muted-foreground">Online</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn('flex items-end gap-2', msg.role === 'user' && 'justify-end')}>
                                {msg.role === 'assistant' && (
                                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <Bot className="h-3.5 w-3.5" />
                                    </div>
                                )}
                                <div className={cn(
                                    'max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed [&_p]:mb-1 [&_p:last-child]:mb-0 [&_code]:bg-black/10 [&_code]:px-1 [&_code]:rounded [&_code]:text-[0.85em] [&_ul]:pl-4 [&_ol]:pl-4',
                                    msg.role === 'assistant'
                                        ? 'bg-muted text-foreground rounded-bl-sm border'
                                        : 'bg-primary/10 text-foreground rounded-br-sm border border-primary/20'
                                )}>
                                    <Markdown>{msg.content}</Markdown>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="h-6 w-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                                        <User className="h-3.5 w-3.5" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-end gap-2">
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <Bot className="h-3.5 w-3.5" />
                                </div>
                                <div className="bg-muted rounded-xl rounded-bl-sm border px-3 py-3 flex gap-1 items-center">
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.32s]" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.16s]" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t bg-muted/50 flex gap-2 items-end">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question..."
                            rows={1}
                            className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 max-h-24 leading-relaxed"
                        />
                        <button
                            className={cn(
                                'h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all',
                                inputValue.trim() && !isLoading
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                            )}
                            disabled={!inputValue.trim() || isLoading}
                            onClick={handleSendMessage}
                        >
                            {isLoading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Send className="h-[18px] w-[18px]" />}
                        </button>
                    </div>
                </div>
            )}

            {/* FAB */}
            {!isOpen && (
                <button
                    className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-blue-500 text-white flex items-center justify-center shadow-lg hover:scale-105 hover:shadow-xl transition-all group animate-bounce-slow"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open AI Assistant"
                >
                    <MessageCircle className="h-6 w-6" />
                    <span className="absolute right-[75px] bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border shadow-md">
                        Ask StudyGenie
                    </span>
                </button>
            )}
        </div>
    )
}
