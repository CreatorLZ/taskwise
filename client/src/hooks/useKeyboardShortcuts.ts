import { useEffect, useCallback, useState } from "react";

interface KeyboardShortcutConfig {
  onNewTask?: () => void;
  onSearch?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onSelectTask?: (index: number) => void;
  onCompleteTask?: () => void;
  onDeleteTask?: () => void;
  onShowHelp?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

interface ShortcutDefinition {
  key: string;
  description: string;
  category: string;
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    meta?: boolean;
    alt?: boolean;
  };
}

export const KEYBOARD_SHORTCUTS: ShortcutDefinition[] = [
  { key: "n", description: "New task", category: "Tasks" },
  { key: "/", description: "Quick search", category: "Navigation" },
  {
    key: "k",
    description: "Quick search (alternative)",
    category: "Navigation",
    modifiers: { ctrl: true },
  },
  { key: "j", description: "Navigate down", category: "Navigation" },
  { key: "k", description: "Navigate up", category: "Navigation" },
  { key: "Enter", description: "Open task details", category: "Tasks" },
  { key: "c", description: "Mark task complete", category: "Tasks" },
  { key: "d", description: "Delete task", category: "Tasks" },
  { key: "?", description: "Show keyboard shortcuts", category: "Help" },
  { key: "Escape", description: "Close modal/dialog", category: "General" },
];

export function useKeyboardShortcuts(config: KeyboardShortcutConfig) {
  const {
    onNewTask,
    onSearch,
    onNavigateUp,
    onNavigateDown,
    onSelectTask,
    onCompleteTask,
    onDeleteTask,
    onShowHelp,
    onEscape,
    enabled = true,
  } = config;

  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore shortcuts when typing in input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Only allow Escape in inputs
        if (event.key !== "Escape") return;
      }

      const isCtrlOrMeta = event.ctrlKey || event.metaKey;

      switch (event.key.toLowerCase()) {
        case "n":
          if (!isCtrlOrMeta && onNewTask) {
            event.preventDefault();
            onNewTask();
          }
          break;

        case "/":
          if (!isCtrlOrMeta && onSearch) {
            event.preventDefault();
            onSearch();
          }
          break;

        case "k":
          if (isCtrlOrMeta && onSearch) {
            event.preventDefault();
            onSearch();
          } else if (!isCtrlOrMeta && onNavigateUp) {
            event.preventDefault();
            setSelectedIndex((prev) => Math.max(0, prev - 1));
            onNavigateUp();
          }
          break;

        case "j":
          if (!isCtrlOrMeta && onNavigateDown) {
            event.preventDefault();
            setSelectedIndex((prev) => prev + 1);
            onNavigateDown();
          }
          break;

        case "enter":
          if (!isCtrlOrMeta && selectedIndex >= 0 && onSelectTask) {
            event.preventDefault();
            onSelectTask(selectedIndex);
          }
          break;

        case "c":
          if (!isCtrlOrMeta && onCompleteTask) {
            event.preventDefault();
            onCompleteTask();
          }
          break;

        case "d":
          if (!isCtrlOrMeta && onDeleteTask) {
            event.preventDefault();
            onDeleteTask();
          }
          break;

        case "?":
          if (event.shiftKey && onShowHelp) {
            event.preventDefault();
            onShowHelp();
          }
          break;

        case "escape":
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
      }
    },
    [
      enabled,
      onNewTask,
      onSearch,
      onNavigateUp,
      onNavigateDown,
      onSelectTask,
      onCompleteTask,
      onDeleteTask,
      onShowHelp,
      onEscape,
      selectedIndex,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    selectedIndex,
    setSelectedIndex,
    shortcuts: KEYBOARD_SHORTCUTS,
  };
}

export default useKeyboardShortcuts;
