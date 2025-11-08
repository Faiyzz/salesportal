"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, LogIn } from "lucide-react"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid credentials. Please try again.")
      } else {
        toast.success("Signed in successfully!")
        const session = await getSession()
        if (session?.user?.role === "ADMIN") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }
    } catch {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 -z-10 bg-[url('/images/loginbg.jpeg')] bg-cover bg-center" aria-hidden />

      {/* Blue glassy overlay */}
      <div className="absolute inset-0 -z-10 bg-blue-900/40" aria-hidden />

      {/* Soft vignette for focus */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0.45))]" aria-hidden />

      {/* Floating subtle particles (pure CSS, very light) */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]">
        <div className="absolute -left-10 top-20 h-64 w-64 rounded-full bg-white/6 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-blue-300/10 blur-3xl" />
      </div>

      {/* Content container */}
      <div className="relative mx-auto flex min-h-dvh max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <Card className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-2xl supports-[backdrop-filter]:bg-white/10">

              <CardHeader className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl"
                >
                  <Shield className="h-5 w-5 text-white/80" />
                </motion.div>
                <CardTitle className="text-3xl font-semibold tracking-tight text-white drop-shadow-md">
                  Sales Portal
                </CardTitle>
                <CardDescription className="text-white/80">
                  Sign in to your account to access the portal
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.45 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="email" className="text-white/90">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="peer h-12 rounded-2xl border-white/20 bg-white/10 text-black placeholder:text-black/60 backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-black/40"
                      />
                      {/* Focus glow */}
                      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/0 transition peer-focus:ring-white/30" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22, duration: 0.45 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="password" className="text-white/90">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="peer h-12 rounded-2xl border-white/20 bg-white/10 text-black placeholder:text-black/60 backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-black/40"
                      />

                      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/0 transition peer-focus:ring-white/30" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.45 }}
                  >
                    <Button
                      type="submit"
                      className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#6c1898]/90 font-medium text-white shadow-xl backdrop-blur-xl transition focus-visible:outline-none"
                      disabled={isLoading}
                    >
                      {/* sheen */}
                      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.35),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
                      <LogIn className="h-4 w-4 opacity-90" />
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </motion.div>
                </form>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.45 }}
                  className="mt-6 text-center text-sm text-white/80"
                >
                  Don’t have an account?{" "}
                  <a href="/register" className="font-semibold text-white underline/30 hover:underline">
                    Register Now
                  </a>
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
