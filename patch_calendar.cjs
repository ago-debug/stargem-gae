const fs = require('fs');
let content = fs.readFileSync('client/src/pages/calendar.tsx', 'utf8');

const scrollableComponent = `
function ScrollableFilterBar({ children, className }: { children: React.ReactNode, className?: string }) {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = React.useState(false);
    const [showRight, setShowRight] = React.useState(false);

    const checkScroll = React.useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeft(scrollLeft > 0);
        setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }, []);

    React.useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        // Timeout per il primo render e caricamento dati
        const timeout = setTimeout(checkScroll, 500);
        return () => {
            window.removeEventListener('resize', checkScroll);
            clearTimeout(timeout);
        };
    }, [checkScroll]);

    React.useEffect(() => {
        if (!scrollRef.current) return;
        const observer = new MutationObserver(checkScroll);
        observer.observe(scrollRef.current, { childList: true, subtree: true, characterData: true });
        return () => observer.disconnect();
    }, [checkScroll]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
        }
    };

    return (
        <div className="relative flex items-center w-full min-w-0 group">
            {showLeft && (
                <div className="absolute left-0 z-10 bg-gradient-to-r from-white via-white/90 to-transparent pr-4 py-1 h-full flex items-center pointer-events-none">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shadow-sm bg-white border border-slate-200 pointer-events-auto hover:bg-slate-100" onClick={() => scroll('left')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <div ref={scrollRef} onScroll={checkScroll} className={\`flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap \${className || ''}\`}>
                {children}
            </div>
            {showRight && (
                <div className="absolute right-0 z-10 bg-gradient-to-l from-white via-white/90 to-transparent pl-4 py-1 h-full flex items-center pointer-events-none">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shadow-sm bg-white border border-slate-200 pointer-events-auto hover:bg-slate-100" onClick={() => scroll('right')}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

`;

// Aggiungiamo il componente appena prima di export default function CalendarPage
content = content.replace('export default function CalendarPage() {', scrollableComponent + 'export default function CalendarPage() {');

// Rimpiazziamo Riga 1
content = content.replace(
    /<div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap w-full md:w-auto md:justify-end pb-1 md:pb-0">/g,
    '<ScrollableFilterBar className="w-full md:w-auto md:justify-end pb-1 md:pb-0">'
);

// Rimpiazziamo Riga 2 prima parte
content = content.replace(
    /<div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap shrink-0">/g,
    '<ScrollableFilterBar className="shrink-0">'
);

// Chiudiamo i div che sono diventati ScrollableFilterBar.
// Dato che regex replace non è smart sui tag di chiusura, 
// cerchiamo esattamente le parti corrispondenti o facciamo un rimpiazzo manuale mirato.
