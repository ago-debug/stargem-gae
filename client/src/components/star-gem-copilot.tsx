import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Brain, Bot } from "lucide-react";

interface StarGemCopilotProps {
    onSelect?: (ai: string) => void;
    className?: string;
}

/**
 * StarGem CoPilot Component
 * Provides a quick access menu to different AI assistants (ChatGPT, Gemini, Claude).
 */
export function StarGemCopilot({ onSelect, className = "" }: StarGemCopilotProps) {
    const handleSelect = (ai: string) => {
        // This is a UI-only component for now, fulfilling the visual/interactive requirement.
        // In a future phase, this could integrate with actual AI APIs.
        if (onSelect) onSelect(ai);
        console.log(`StarGem CoPilot - AI Selected: ${ai}`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 sidebar-icon-gold hover:text-amber-500 transition-colors ${className}`}
                    title="StarGem CoPilot"
                >
                    <Sparkles className="w-4 h-4 fill-current" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-amber-200/50 bg-white/95 backdrop-blur-sm">
                <div className="px-2 py-1.5 text-xs font-semibold text-amber-600 border-b border-amber-100 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    StarGem CoPilot
                </div>
                <DropdownMenuItem onClick={() => handleSelect("ChatGPT")} className="gap-2 cursor-pointer focus:bg-emerald-50 focus:text-emerald-700">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <span>ChatGPT Assistant</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSelect("Gemini")} className="gap-2 cursor-pointer focus:bg-blue-50 focus:text-blue-700">
                    <Brain className="w-4 h-4 text-blue-500" />
                    <span>Google Gemini</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSelect("Claude")} className="gap-2 cursor-pointer focus:bg-orange-50 focus:text-orange-700">
                    <Bot className="w-4 h-4 text-orange-500" />
                    <span>Anthropic Claude</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
