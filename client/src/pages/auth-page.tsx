import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { insertUserSchema } from "@shared/schema";
import {
  Users,
  Kanban,
  Stethoscope,
  Building,
  Sparkles,
  CalendarDays,
  Megaphone,
  Volume2,
  VolumeX,
  BriefcaseBusiness,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
const logoStarGem = "/logo_stargem.png";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Gestione randomica delle clip di Teo e Audio
  const videos = [
    "/assets/teo_animato1.mp4",
    "/assets/teo_animato2.mp4",
    "/assets/teo_animato3.mp4",
    "/assets/teo_animato4.mp4",
    "/assets/teo_animato5.mp4",
    "/assets/teo_animato6.mp4",
  ];
  const [teoVideo, setTeoVideo] = useState(videos[0]); // Default 1
  const [isMuted, setIsMuted] = useState(true);
  const [highlightForm, setHighlightForm] = useState(false);

  useEffect(() => {
    // Al refresh/load, scegliamo random
    const initialVideo = videos[Math.floor(Math.random() * videos.length)];
    setTeoVideo(initialVideo);

    // Ogni 15 secondi cambia in automatico
    const interval = setInterval(() => {
      setTeoVideo((current) => {
        const currentIndex = videos.indexOf(current);
        return videos[(currentIndex + 1) % videos.length];
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleVideoClick = () => {
    setTeoVideo((current) => {
      const currentIndex = videos.indexOf(current);
      return videos[(currentIndex + 1) % videos.length];
    });
  };

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((prev) => !prev);
  };

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  if (user) {
    if ((user as any).email_verified === false) {
      setLocation(
        `/first-login?email=${encodeURIComponent((user as any).email || "")}`,
      );
      return null;
    }

    if ((user as any).role?.toLowerCase() === "dipendente") {
      setLocation("/gemteam/me");
      return null;
    }

    if ((user as any).role?.toLowerCase() === "insegnante") {
      setLocation("/gemstaff/me");
      return null;
    }

    setLocation((user as any).redirectTo || "/calendario-attivita");
    return null;
  }

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data, {
      onSuccess: (res: any) => {
        if (res.email_verified === false) {
          setLocation(
            `/first-login?email=${encodeURIComponent(res.email || "")}`,
          );
        } else {
          setLocation(res.redirectTo || "/calendario-attivita");
        }
      },
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background pb-16 pt-10 text-foreground transition-colors duration-300">
      <style
        dangerouslySetInnerHTML={{
          __html: `
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-25px) rotate(2deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
            `,
        }}
      />

      {/* Sfondo decorativo vettoriale premium */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/10 via-background to-blue-500/10" />
      <div className="pointer-events-none absolute right-[-5%] top-[-10%] h-[500px] w-[500px] animate-pulse rounded-full bg-primary/10 blur-[100px]" />
      <div
        className="pointer-events-none absolute bottom-[-10%] left-[-5%] h-[400px] w-[400px] animate-pulse rounded-full bg-blue-500/10 blur-[80px]"
        style={{ animationDelay: "2s" }}
      />

      {/* Wrapper principale Unificato Form + Animazione */}
      <div className="relative z-10 mx-4 mt-10 w-full max-w-4xl duration-500 animate-in fade-in zoom-in-95">
        {new URLSearchParams(window.location.search).get("hint") ===
          "staff" && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-medium text-amber-800 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400">
            <span>
              Sei un insegnante di Studio Gem? Se è il tuo primo accesso &rarr;
            </span>
            <Link
              href="/first-login"
              className="font-bold text-amber-700 underline hover:text-amber-900 dark:text-amber-300"
            >
              Clicca qui per impostare la password
            </Link>
          </div>
        )}

        <Card
          className={`relative z-30 flex w-full flex-col items-center !overflow-visible rounded-xl border-none bg-background/90 shadow-2xl backdrop-blur-sm lg:flex-row ${highlightForm ? "shadow-amber-200/50 ring-4 ring-amber-400 transition-all duration-300" : "transition-all duration-300"}`}
        >
          {/* COLONNA SINISTRA: IL FORM DI LOGIN */}
          <div className="mx-auto w-full max-w-md flex-1 py-2">
            <CardHeader className="space-y-2 pb-4 text-center">
              <div className="my-0 flex justify-center">
                <div className="flex h-28 w-64 scale-110 items-center justify-center overflow-hidden">
                  <img
                    src={logoStarGem}
                    alt="StarGem"
                    className="size-full scale-[1.6] object-contain transition-transform duration-500 hover:scale-[1.7]"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground">
                  La suite di StarGem
                </CardTitle>
                <CardDescription className="text-sm font-medium text-muted-foreground">
                  The integrated platform for your activities.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                          EMAIL O USERNAME
                        </FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="off"
                            placeholder="Email o username"
                            className="h-11 border-border bg-muted/50 shadow-sm transition-all focus:bg-background"
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
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="off"
                            className="h-11 border-border bg-muted/50 shadow-sm transition-all focus:bg-background"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="text-md h-11 w-full font-bold shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Accesso in corso..." : "Accedi"}
                  </Button>
                  <div className="mt-2 text-center">
                    <a
                      href="/forgot-password"
                      style={{ fontSize: "12px", color: "#F59E0B" }}
                      className="font-medium hover:underline"
                    >
                      Password dimenticata?
                    </a>
                  </div>
                </form>
              </Form>
            </CardContent>
          </div>

          {/* COLONNA DESTRA: TEO COPILOT (Visibile anche da Mobile) */}
          <div className="relative flex size-full min-h-[320px] flex-1 items-center justify-center rounded-b-xl bg-slate-100 dark:bg-slate-200 lg:min-h-[400px] lg:rounded-b-none lg:rounded-r-xl">
            <div
              className="group absolute inset-0 flex size-full cursor-pointer items-center justify-center"
              onClick={handleVideoClick}
            >
              <video
                key={
                  teoVideo
                } /* Forza il reload del video quando cambia il src per browser più vecchi */
                src={teoVideo}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="size-full object-contain opacity-[0.98] mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
              />

              {/* Pellicola sfumata scura a cerchio (Night Mode Vignette Overlay) */}
              <div className="pointer-events-none absolute inset-0 z-10 hidden rounded-b-xl bg-[radial-gradient(circle,transparent_25%,rgba(0,0,0,0.4)_70%,hsl(var(--background))_100%)] transition-all duration-500 dark:block lg:rounded-b-none lg:rounded-r-xl" />

              {/* Audio Toggle Button */}
              <button
                onClick={toggleAudio}
                className="absolute bottom-4 right-4 z-50 rounded-full border border-border bg-slate-100 p-2.5 text-muted-foreground shadow-md transition-colors hover:bg-slate-200 hover:text-foreground/80 dark:bg-slate-800"
                title={isMuted ? "Attiva audio" : "Disattiva audio"}
              >
                {isMuted ? (
                  <VolumeX className="size-5" />
                ) : (
                  <Volume2 className="size-5" />
                )}
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Griglia Moduli Suite */}
      <div className="z-10 mt-16 flex w-full max-w-5xl flex-col items-center px-4 delay-300 duration-700 animate-in fade-in slide-in-from-bottom-8 fill-mode-both">
        <div className="mb-8 flex w-full max-w-2xl items-center gap-4">
          <div className="h-px flex-1 bg-border"></div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            Questa piattaforma contiene
          </p>
          <div className="h-px flex-1 bg-border"></div>
        </div>

        <div className="flex w-full flex-wrap justify-center gap-4 md:gap-6">
          {[
            { name: "GemTeam", icon: Users, desc: "Team & HR" },
            { name: "Gemory", icon: Kanban, desc: "Project Manager" },
            { name: "Gemdario", icon: CalendarDays, desc: "Calendario" },
            { name: "BookGem", icon: Building, desc: "Aule & Booking" },
            { name: "MedGem", icon: Stethoscope, desc: "Studio Medico" },
            { name: "Clarissa", icon: Megaphone, desc: "CRM & Marketing" },
            {
              name: "GemStaff",
              icon: BriefcaseBusiness,
              desc: "Staff Manager",
              hint: "staff",
              subLabel: "Accesso Insegnanti →",
            },
            { name: "TeoCopilot", icon: Sparkles, desc: "AI Aziendale" },
          ].map((mod, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (mod.hint === "staff") {
                  setLocation("/first-login");
                } else {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="group flex min-w-[120px] max-w-[140px] flex-1 cursor-pointer flex-col items-center justify-center rounded-[24px] border border-border bg-background/80 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              {/* Icona 3D Dorata */}
              <div
                className="relative mb-4 flex size-16 transform-gpu items-center justify-center rounded-[20px] bg-gradient-to-br from-yellow-100 via-amber-400 to-yellow-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-4px_6px_rgba(180,100,0,0.5),0_10px_20px_rgba(245,158,11,0.3)] transition-transform duration-300 group-hover:scale-105"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-gradient-to-t from-black/10 to-transparent mix-blend-overlay"></div>
                {mod.name === "TeoCopilot" ? (
                  <Avatar className="relative z-10 size-11 border-2 border-white bg-background shadow-sm">
                    <AvatarImage
                      src="/assets/teo-head-new.png"
                      alt="Teo"
                      className="object-cover"
                    />
                  </Avatar>
                ) : (
                  <mod.icon className="relative z-10 size-8 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]" />
                )}
              </div>

              <span className="text-[15px] font-extrabold text-foreground">
                {mod.name}
              </span>
              <span className="mt-1 text-center text-xxs font-bold uppercase leading-tight tracking-wider text-slate-400">
                {mod.desc}
              </span>
              {(mod as any).subLabel && (
                <span
                  style={{ color: "#F59E0B", fontSize: 9, fontStyle: "italic" }}
                  className="mt-1 font-bold"
                >
                  {(mod as any).subLabel}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
