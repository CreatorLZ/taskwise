import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import useNotificationStore from "@/hooks/useNotificationStore";
// import useNotificationStore from '../store/notificationStore';

export function NotificationButton() {
  const { isLoading, enableNotifications } = useNotifications();
  const isEnabled = useNotificationStore((state) => state.isEnabled);

  if (isEnabled) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => enableNotifications()}
      disabled={isLoading}
      className="gap-2"
    >
      <Bell className="h-4 w-4" />
      {isLoading ? "Enabling..." : "Enable Notifications"}
    </Button>
  );
}
