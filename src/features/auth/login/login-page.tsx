"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useLoginMutation } from "@/hooks/auth/use-auth-mutation";
import type { LoginRequestPayload } from "@/types/auth";

function getPostLoginRoute(roleCodes: readonly string[]) {
  if (
    roleCodes.includes("MAINTENANCE_TECHNICIAN") &&
    !roleCodes.includes("SYSTEM_MONITORING_OPERATOR") &&
    !roleCodes.includes("IT_ADMINISTRATOR")
  ) {
    return "/tickets/me";
  }

  return "/tickets";
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LOGIN_COPY = {
  eyebrow: "Central Command Center",
  title: "AR-based Infrastructure Monitoring & Maintenance System",
  subtitle:
    "Empowering administrators with real-time cluster telemetry and field technicians with spatial AR-integrated maintenance workflows",
  primaryCta: "Sign in",
} as const;

const CAPABILITY_RAIL = [
  {
    label: "Monitoring",
    value: "Real-time telemetry streaming and historical metrics visualization",
  },
  {
    label: "Visualization",
    value: "Visualizing hardware architecture from racks down to individual components",
  },
  {
    label: "AR Operations",
    value: "Augmented reality-integrated maintenance operations workflow for on-site technicians",
  },
] as const;

export function LoginPage() {
  const router = useRouter();
  const loginMutation = useLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  async function onSubmit(values: LoginFormValues) {
    const payload: LoginRequestPayload = {
      email: values.email,
      password: values.password,
    };

    const response = await loginMutation.mutateAsync(payload);
    router.replace(getPostLoginRoute(response.user.roleCodes));
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center py-12 md:py-16">
      {/* Gradient Overlay Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.1),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.06),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(var(--grid-color)_1px,transparent_1px),linear-gradient(90deg,var(--grid-color)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      </div>

      <div className="relative w-full mx-auto max-w-7xl grid items-center gap-12 px-6 md:px-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        {/* Left column: Console information panel */}
        <section className="flex flex-col justify-between gap-12 lg:min-h-[560px]">
          <div className="space-y-8">
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-1/40 px-3.5 py-1.5 text-[11px] font-mono tracking-[0.18em] text-muted-foreground light:font-bold uppercase">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan" />
                {LOGIN_COPY.eyebrow}
              </div>

              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl leading-[1.08]">
                AR-based Infrastructure{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan via-electric to-purple font-extrabold">
                  Monitoring & Maintenance
                </span>{" "}
                System
              </h1>

              <p className="text-sm md:text-base leading-relaxed text-muted-foreground max-w-lg">
                {LOGIN_COPY.subtitle}
              </p>
            </div>
          </div>

          {/* Capabilities Rail */}
          <div className="grid gap-6 border-t border-border/60 pt-8 grid-cols-3 max-w-xl">
            {CAPABILITY_RAIL.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-cyan" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground light:text-primary light:font-bold">
                    {item.label}
                  </p>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground light:text-muted-foreground font-sans">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Right column: Access terminal login card */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md lg:max-w-none justify-self-center lg:justify-self-end"
        >
          {/* Double-Bezel Nested Architecture wrapper */}
          <div className="relative group p-1.5 rounded-3xl bg-surface-1/20 border border-border/50 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-cyan/25 hover:shadow-[0_0_50px_rgba(6,182,212,0.04)]">
            {/* Soft Ambient glow under wrapper */}
            <div className="absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.08),transparent_60%)] blur-xl" />

            {/* Inner Core Card */}
            <div className="rounded-[calc(1.5rem-2px)] border border-border bg-card/60 p-6 md:p-8 lg:p-10 shadow-2xl backdrop-blur-2xl space-y-6">
              {/* Card Header */}
              <div className="space-y-4">
                <div className="flex-col items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
                    SYSTEM ACCESS // AR-IMMS
                  </span>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    Sign in
                  </h2>
                </div>
              </div>

              {/* Login Form */}
              <form
                className="space-y-5"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                {/* Email Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-between"
                  >
                    <span>Email</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="h-11 w-full rounded-lg border border-border bg-background/60 px-3.5 text-xs text-foreground font-mono placeholder:text-muted-foreground/60 placeholder:font-mono outline-none transition-all duration-300 focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 focus:bg-background"
                    placeholder="operator@company.com"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email ? (
                    <p className="flex items-center gap-1.5 text-[11px] font-mono text-rose-400 mt-1">
                      <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                      {form.formState.errors.email.message}
                    </p>
                  ) : null}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-between"
                  >
                    <span>Password</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="h-11 w-full rounded-lg border border-border bg-background/60 px-3.5 text-xs text-foreground font-mono placeholder:text-muted-foreground/60 outline-none transition-all duration-300 focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 focus:bg-background"
                    placeholder="••••••••••••"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password ? (
                    <p className="flex items-center gap-1.5 text-[11px] font-mono text-rose-400 mt-1">
                      <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                      {form.formState.errors.password.message}
                    </p>
                  ) : null}
                </div>

                {/* Mutation Error readout */}
                {loginMutation.error ? (
                  <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-mono text-rose-400 flex items-start gap-2">
                    <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block uppercase text-[10px] tracking-wider text-rose-500 mb-0.5">
                        Authorization Error
                      </span>
                      {(loginMutation.error as Error).message}
                    </div>
                  </div>
                ) : null}

                {/* CTA Submit Button */}
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="relative group/btn inline-flex h-11 w-full items-center justify-center mt-5 gap-2 rounded-lg bg-cyan px-4 text-xs font-mono uppercase tracking-wider text-primary-foreground font-bold transition-all duration-300 hover:bg-cyan/90 hover:shadow-[0_0_20px_rgba(0,209,255,0.25)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Activity className="h-3.5 w-3.5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      {LOGIN_COPY.primaryCta}
                      {/* Button-in-button trailing icon pattern */}
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/10 transition-transform duration-300 group-hover/btn:translate-x-1">
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
