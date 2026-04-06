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
import { Users, Kanban, Stethoscope, Building, Sparkles, CalendarDays, Megaphone } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
const logoStarGem = "/logo_stargem.png";

const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function AuthPage() {
    const { user, loginMutation } = useAuth();
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

            <div className="relative w-full max-w-md mx-4 z-10 animate-in fade-in zoom-in-95 duration-500 mt-10">
                {/* Teo Fluttuante - Agganciato fisicamente al pannello */}
                <div 
                   className="hidden xl:block absolute -right-[230px] top-[15%] w-72 h-72 z-40 pointer-events-none"
                   style={{ animation: 'float 6s ease-in-out infinite' }}
                >
                    <img src="/assets/teo-full-new.png" alt="Teo Copilot in volo" className="w-full h-full object-contain mix-blend-multiply opacity-90" />
                </div>

                <Card className="w-full shadow-2xl border-none bg-white/90 backdrop-blur-sm relative z-30">
                    <CardHeader className="text-center space-y-3 pb-6">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-primary/5 rounded-2xl shadow-inner border border-primary/10 transition-transform duration-500 hover:scale-105 hover:rotate-3">
                            <img src={logoStarGem} alt="StarGem" className="h-28 object-contain mix-blend-multiply" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900">La suite di StarGem</CardTitle>
                        <CardDescription className="text-sm font-medium text-slate-500">
                            Il tuo gestionale in movimento.
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
                        { name: "MedGem", icon: Stethoscope, desc: "Studio Medico" },
                        { name: "BookGem", icon: Building, desc: "Aule & Booking" },
                        { name: "TeoCopilot", icon: Sparkles, desc: "AI Aziendale" },
                        { name: "Gemdario", icon: CalendarDays, desc: "Calendario" },
                        { name: "Clarissa", icon: Megaphone, desc: "CRM & Marketing" }
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
