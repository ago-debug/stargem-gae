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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50">
            {/* Sfondo decorativo vettoriale premium */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-slate-50 to-blue-500/5 z-0" />
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

            <Card className="w-full max-w-md mx-4 shadow-2xl border-none bg-white/90 backdrop-blur-sm z-10 animate-in fade-in zoom-in-95 duration-500">
                <CardHeader className="text-center space-y-3 pb-6">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-primary/5 rounded-2xl shadow-inner border border-primary/10 transition-transform duration-500 hover:scale-105 hover:rotate-3">
                            <img src={logoStarGem} alt="StarGem" className="h-28 object-contain mix-blend-multiply" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900">Bentornato</CardTitle>
                        <CardDescription className="text-sm font-medium text-slate-500">
                            CourseManager Premium Edition
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
    );
}
