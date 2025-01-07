import { Card } from "@/components/ui/card";
const TaskSkeletonLoader = () => {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-6 w-20 rounded bg-muted animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-8 w-8 rounded bg-muted animate-pulse" />
      </div>
    </Card>
  );
};

export default TaskSkeletonLoader;
