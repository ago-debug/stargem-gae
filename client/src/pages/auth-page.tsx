import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertUserSchema } from "@shared/schema";
import { Users, Kanban, Stethoscope, Building, Sparkles, CalendarDays, Megaphone, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
const logoStarGem = "/logo_stargem.png";

const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function AuthPage() {
    const { user, loginMutation } = useAuth();
    
    // Gestione randomica delle clip di Teo e Audio
    const videos = [
        "/assets/teo_animato1.mp4",
        "/assets/teo_animato2.mp4",
        "/assets/teo_animato3.mp4",
        "/assets/teo_animato4.mp4",
        "/assets/teo_animato5.mp4",
        "/assets/teo_animato6.mp4"
    ];
    const [teoVideo, setTeoVideo] = useState(videos[0]); // Default 1
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        // Al refresh/load, scegliamo random
        const initialVideo = videos[Math.floor(Math.random() * videos.length)];
        setTeoVideo(initialVideo);

        // Ogni 15 secondi cambia in automatico
        const interval = setInterval(() => {
            setTeoVideo(current => {
                const currentIndex = videos.indexOf(current);
                return videos[(currentIndex + 1) % videos.length];
            });
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    const handleVideoClick = () => {
        setTeoVideo(current => {
            const currentIndex = videos.indexOf(current);
            return videos[(currentIndex + 1) % videos.length];
        });
    };

    const toggleAudio = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(prev => !prev);
    };

    const form = useForm<LoginData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: import.meta.env.DEV ? "admin" : "",
            password: import.meta.env.DEV ? "Palermo_1" : "",
        },
    });


    if (user) {
        // Redirect is handled by the creating component (Router)
        return null;
    }

    const onSubmit = (data: LoginData) => {
        loginMutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 pt-10 pb-16">
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-25px) rotate(2deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
            `}} />
            
            {/* Sfondo decorativo vettoriale premium */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-slate-50 to-blue-500/5 z-0" />
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

            {/* Wrapper principale Unificato Form + Animazione */}
            <div className="relative w-full max-w-4xl mx-4 z-10 animate-in fade-in zoom-in-95 duration-500 mt-10">
                <Card className="w-full shadow-2xl border-none bg-white/90 backdrop-blur-sm relative z-30 flex flex-col lg:flex-row !overflow-visible items-center rounded-xl">
                    
                    {/* COLONNA SINISTRA: IL FORM DI LOGIN */}
                    <div className="flex-1 w-full max-w-md mx-auto py-2">
                    <CardHeader className="text-center space-y-2 pb-4">
                    <div className="flex justify-center mb-0 mt-0">
                        <div className="overflow-hidden h-28 w-64 flex items-center justify-center scale-110">
                            <img src={logoStarGem} alt="StarGem" className="w-full h-full object-contain scale-[1.6] mix-blend-multiply transition-transform duration-500 hover:scale-[1.7]" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900">La suite di StarGem</CardTitle>
                        <CardDescription className="text-sm font-medium text-slate-500">
                            Il tuo gestionale per il movimento.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Username</FormLabel>
                                        <FormControl>
                                            <Input 
                                                autoComplete="username" 
                                                className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all shadow-sm" 
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Password</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="password" 
                                                autoComplete="current-password" 
                                                className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all shadow-sm" 
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="w-full h-11 text-md font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                                disabled={loginMutation.isPending}
                            >
                                {loginMutation.isPending ? "Accesso in corso..." : "Accedi al Gestionale"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                </div>

                {/* COLONNA DESTRA: TEO COPILOT */}
                <div className="hidden lg:flex flex-1 w-full h-full relative items-center justify-center border-l border-slate-200/60 bg-white/50 min-h-[400px] rounded-r-xl">
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer group" onClick={handleVideoClick}>
                        <video 
                            key={teoVideo} /* Forza il reload del video quando cambia il src per browser più vecchi */
                            src={teoVideo} 
                            autoPlay 
                            loop 
                            muted={isMuted} 
                            playsInline 
                            className="w-full h-full object-contain group-hover:scale-105 mix-blend-multiply opacity-[0.98] transition-transform duration-500" 
                        />
                        {/* Audio Toggle Button */}
                        <button 
                            onClick={toggleAudio}
                            className="absolute bottom-4 right-4 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full shadow-md transition-colors z-50 border border-slate-200"
                            title={isMuted ? "Attiva audio" : "Disattiva audio"}
                        >
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                </Card>
            </div>

            {/* Griglia Moduli Suite */}
            <div className="mt-16 z-10 w-full max-w-5xl px-4 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
                <div className="flex items-center gap-4 mb-8 w-full max-w-2xl">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Questo gestionale contiene</p>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 md:gap-6 w-full">
                    {[
                        { name: "GemTeam", icon: Users, desc: "Team & HR" },
                        { name: "Gemory", icon: Kanban, desc: "Project Manager" },
                        { name: "Gemdario", icon: CalendarDays, desc: "Calendario" },
                        { name: "BookGem", icon: Building, desc: "Aule & Booking" },
                        { name: "MedGem", icon: Stethoscope, desc: "Studio Medico" },
                        { name: "Clarissa", icon: Megaphone, desc: "CRM & Marketing" },
                        { name: "TeoCopilot", icon: Sparkles, desc: "AI Aziendale" }
                    ].map((mod, idx) => (
                        <div key={idx} className="flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur-md rounded-[24px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 min-w-[120px] max-w-[140px] flex-1 group">
                            
                            {/* Icona 3D Dorata */}
                            <div className="relative w-16 h-16 rounded-[20px] bg-gradient-to-br from-yellow-100 via-amber-400 to-yellow-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-4px_6px_rgba(180,100,0,0.5),0_10px_20px_rgba(245,158,11,0.3)] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300 transform-gpu" style={{ transformStyle: 'preserve-3d' }}>
                                <div className="absolute inset-0 rounded-[20px] bg-gradient-to-t from-black/10 to-transparent pointer-events-none mix-blend-overlay"></div>
                                {mod.name === "TeoCopilot" ? (
                                    <Avatar className="w-11 h-11 border-2 border-white shadow-sm relative z-10 bg-white">
                                        <AvatarImage src="/assets/teo-head-new.png" alt="Teo" className="object-cover" />
                                    </Avatar>
                                ) : (
                                    <mod.icon className="w-8 h-8 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] relative z-10" />
                                )}
                            </div>

                            <span className="font-extrabold text-slate-800 text-[15px]">{mod.name}</span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1 leading-tight">{mod.desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
