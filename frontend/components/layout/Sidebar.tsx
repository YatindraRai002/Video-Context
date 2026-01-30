"use client"

import * as React from "react"
import { MessageSquarePlus, Mic, History, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Sidebar({ className }: { className?: string }) {


    return (
        <div className={cn("flex flex-col h-full bg-muted/30 border-r w-[260px] p-4", className)}>
            <div className="flex items-center gap-2 px-2 mb-8">
                <Mic className="h-6 w-6 text-primary" />
                <span className="font-semibold text-lg tracking-tight">VoiceRAG Studio</span>
            </div>

            <Button variant="outline" className="justify-start gap-2 mb-6" onClick={() => window.location.reload()}>
                <MessageSquarePlus className="h-4 w-4" />
                New Chat
            </Button>

            <div className="flex-1 overflow-auto">
                <h3 className="text-xs font-medium text-muted-foreground px-2 mb-2">Recent Chats</h3>
                <div className="space-y-1">
                    {/* Mock History Items */}
                    {[1, 2, 3].map((i) => (
                        <Button key={i} variant="ghost" className="w-full justify-start text-xs h-9 truncate">
                            <History className="h-3 w-3 mr-2 opacity-70" />
                            Previous Conversation {i}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="mt-auto border-t pt-4 space-y-2">
                <Button variant="ghost" className="w-full justify-start text-sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                </Button>
                <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">User</span>
                        <span className="text-xs text-muted-foreground">Pro Plan</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
