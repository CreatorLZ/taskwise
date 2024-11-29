import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";

import {
  Card,
  // CardContent,
  // CardDescription,
  // CardHeader,
  // CardTitle,
} from "../components/ui/card";

import { Button } from "../components/ui/button";
// import {Button} from "@/components/ui/button";

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 overflow-x-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <header className="sticky top-0 px-4 lg:px-6 h-14 flex items-center backdrop-blur-md border-b border-gray-200/30 dark:border-gray-800/30 z-50">
        <Link to="#" className="flex items-center justify-center">
          <Brain className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400">
            Taskwise
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            to="#"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link
            to="#"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Pricing
          </Link>
          <Link
            to="#"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            About
          </Link>
          <Link
            to="#"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Contact
          </Link>
        </nav>
      </header>
      <main className="flex-1 relative">
        {/* Animated background gradients */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob dark:opacity-10" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 dark:opacity-10" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 dark:opacity-10" />

        <section className="relative w-full py-12 md:py-24 lg:py-32 xl:py-16 overflow-hidden">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col justify-center space-y-4"
              >
                <div className="space-y-2">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-block rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10 p-1"
                  >
                    <div className="rounded-md px-3 py-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                      <span className="flex items-center text-sm text-primary">
                        <Sparkles className="mr-1 h-4 w-4" />
                        Powered by AI
                      </span>
                    </div>
                  </motion.div>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 dark:from-gray-100 dark:via-gray-200 dark:to-gray-400 pb-3">
                    Transform Your Tasks with AI-Powered Intelligence
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Experience the future of task management. Let AI organize
                    your work while you focus on what matters most.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link to="#">
                    <Button size="lg" className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                      <div className="relative bg-white dark:bg-gray-950 rounded-lg flex items-center px-8 text-black">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </Button>
                  </Link>
                  <Link to="#">
                    <Button
                      size="lg"
                      variant="outline"
                      className="relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                      <span className="relative">Watch Demo</span>
                    </Button>
                  </Link>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mx-auto relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                <div className="relative p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary animate-pulse" />
                      <div className="text-sm font-medium">
                        AI Assistant is analyzing your tasks...
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ width: "0%" }}
                          animate={{ width: ["0%", "100%", "90%"] }}
                          transition={{
                            duration: 2,
                            delay: i * 0.3,
                            repeat: Infinity,
                            repeatDelay: 3,
                          }}
                          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-50"
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.2 }}
                          className="rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4"
                        >
                          <div className="h-2 w-12 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        <section className="relative w-full py-12 md:py-24 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950" />
          <div className="container relative px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="inline-block rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10 px-3 py-1 text-sm"
                >
                  Features
                </motion.div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 dark:from-gray-100 dark:via-gray-200 dark:to-gray-400">
                  Smart Features for Smarter Work
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Discover how Taskwise uses AI to revolutionize your task
                  management experience
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
              {[
                {
                  icon: Brain,
                  title: "AI Task Analysis",
                  description:
                    "Smart categorization and priority suggestions based on your work patterns",
                  features: [
                    "Automatic task categorization",
                    "Priority recommendations",
                    "Pattern recognition",
                  ],
                },
                {
                  icon: Clock,
                  title: "Smart Scheduling",
                  description:
                    "AI-powered time management that adapts to your work style",
                  features: [
                    "Intelligent time blocking",
                    "Calendar optimization",
                    "Meeting time suggestions",
                  ],
                },
                {
                  icon: Zap,
                  title: "Automated Workflows",
                  description:
                    "Create and automate complex task workflows with ease",
                  features: [
                    "Custom workflow templates",
                    "Task dependencies",
                    "Progress tracking",
                  ],
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Card className="relative group lg:h-80 cursor-pointer">
                    <div className="absolute -inset-px bg-gradient-to-r from-purple-500/50 to-pink-500/50 rounded-lg opacity-0 group-hover:opacity-100 transition duration-500 blur-sm  " />
                    <div className="relative bg-white dark:bg-gray-950 rounded-lg p-6 lg:h-80">
                      <feature.icon className="h-10 w-10 text-primary mb-4" />
                      <h3 className="text-xl font-bold mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {feature.description}
                      </p>
                      <ul className="space-y-2">
                        {feature.features.map((item) => (
                          <li
                            key={item}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section className="relative w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center space-y-4 text-center"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 dark:from-gray-100 dark:via-gray-200 dark:to-gray-400">
                  Ready to Get Started?
                </h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  Join thousands of users who are already experiencing the
                  future of task management.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link to="#">
                  <Button size="lg" className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                    <div className="relative bg-white dark:bg-gray-950 rounded-lg flex items-center px-8 text-black">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </Button>
                </Link>
                <Link to="#">
                  <Button
                    size="lg"
                    variant="outline"
                    className="relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                    <span className="relative">Contact Sales</span>
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <footer className="relative flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-gray-200/30 dark:border-gray-800/30 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/50 to-white/50 dark:from-transparent dark:via-gray-900/50 dark:to-gray-950/50" />
        <p className="relative text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Taskwise. All rights reserved.
        </p>
        <nav className="relative sm:ml-auto flex gap-4 sm:gap-6">
          <Link to="#" className="text-xs hover:text-primary transition-colors">
            Terms of Service
          </Link>
          <Link to="#" className="text-xs hover:text-primary transition-colors">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

export default Landing;
