import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Coffee, Zap, Timer } from "lucide-react";

interface PomodoroTimerProps {
  taskId?: string;
  taskTitle?: string;
  onSessionComplete?: (sessionType: "work" | "break", minutes: number) => void;
}

type TimerState = "idle" | "work" | "break";

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes in seconds

export function PomodoroTimer({
  taskId,
  taskTitle,
  onSessionComplete,
}: PomodoroTimerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [secondsRemaining, setSecondsRemaining] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.volume = 0.5;
    return () => {
      audioRef.current = null;
    };
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      // Timer completed
      setIsRunning(false);
      playNotificationSound();

      if (timerState === "work") {
        const newSessions = sessionsCompleted + 1;
        setSessionsCompleted(newSessions);
        onSessionComplete?.("work", WORK_DURATION / 60);

        // Every 4 sessions, take a long break
        const breakDuration =
          newSessions % 4 === 0 ? LONG_BREAK_DURATION : BREAK_DURATION;
        setTimerState("break");
        setSecondsRemaining(breakDuration);

        // Show notification
        showNotification(
          "🍅 Pomodoro Complete!",
          newSessions % 4 === 0
            ? "Time for a 15-minute break!"
            : "Time for a 5-minute break!"
        );
      } else if (timerState === "break") {
        onSessionComplete?.("break", BREAK_DURATION / 60);
        setTimerState("work");
        setSecondsRemaining(WORK_DURATION);

        showNotification("💪 Break Over!", "Ready to focus again?");
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isRunning,
    secondsRemaining,
    timerState,
    sessionsCompleted,
    onSessionComplete,
  ]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Ignore audio errors
      });
    }
  };

  const showNotification = (title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/brain.png" });
    }
  };

  const startTimer = () => {
    if (timerState === "idle") {
      setTimerState("work");
      setSecondsRemaining(WORK_DURATION);
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimerState("idle");
    setSecondsRemaining(WORK_DURATION);
  };

  const skipToBreak = () => {
    setIsRunning(false);
    setTimerState("break");
    setSecondsRemaining(BREAK_DURATION);
  };

  const skipToWork = () => {
    setIsRunning(false);
    setTimerState("work");
    setSecondsRemaining(WORK_DURATION);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getDuration = () => {
    if (timerState === "break") {
      return sessionsCompleted % 4 === 0 ? LONG_BREAK_DURATION : BREAK_DURATION;
    }
    return WORK_DURATION;
  };

  const progress = ((getDuration() - secondsRemaining) / getDuration()) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Timer className="w-4 h-4" />
          <span className="hidden sm:inline">Pomodoro</span>
          {timerState !== "idle" && (
            <span className="text-xs font-mono">
              {formatTime(secondsRemaining)}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            Pomodoro Timer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Task indicator */}
          {taskTitle && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Focusing on:</p>
              <p className="font-medium truncate">{taskTitle}</p>
            </div>
          )}

          {/* Timer display */}
          <div className="text-center">
            <div
              className={`text-6xl font-mono font-bold tracking-wider ${
                timerState === "break"
                  ? "text-green-500"
                  : timerState === "work"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {formatTime(secondsRemaining)}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              {timerState === "work" && (
                <span className="flex items-center gap-1 text-sm text-primary">
                  <Zap className="w-4 h-4" /> Focus Time
                </span>
              )}
              {timerState === "break" && (
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <Coffee className="w-4 h-4" /> Break Time
                </span>
              )}
              {timerState === "idle" && (
                <span className="text-sm text-muted-foreground">
                  Ready to focus?
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="h-2" />

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {!isRunning ? (
              <Button onClick={startTimer} size="lg" className="gap-2">
                <Play className="w-5 h-5" />
                {timerState === "idle" ? "Start" : "Resume"}
              </Button>
            ) : (
              <Button
                onClick={pauseTimer}
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                <Pause className="w-5 h-5" />
                Pause
              </Button>
            )}
            <Button onClick={resetTimer} size="lg" variant="outline">
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>

          {/* Skip buttons */}
          {timerState !== "idle" && (
            <div className="flex justify-center gap-2">
              {timerState === "work" && (
                <Button variant="ghost" size="sm" onClick={skipToBreak}>
                  Skip to break
                </Button>
              )}
              {timerState === "break" && (
                <Button variant="ghost" size="sm" onClick={skipToWork}>
                  Skip break
                </Button>
              )}
            </div>
          )}

          {/* Session counter */}
          <div className="text-center text-sm text-muted-foreground">
            <span className="font-medium text-primary">
              {sessionsCompleted}
            </span>{" "}
            pomodoros completed today
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PomodoroTimer;
