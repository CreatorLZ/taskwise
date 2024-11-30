import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { NewTaskModal } from "@/components/ui/newTask";
import { TaskCard } from "@/components/taskCard";

// import { ThemeToggle } from "@/components/theme-toggle"

export default function TaskDashboard() {
  const [prioritizationEnabled, setPrioritizationEnabled] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                TaskWise
              </h1>
              <p className="text-muted-foreground">Powered by advanced AI</p>
            </div>
            <div className="flex items-center gap-4">
              {/* <ThemeToggle /> */}
              {/* <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button> */}
              <NewTaskModal />
            </div>
          </div>

          {/* AI Assistant Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Suggestions
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="prioritization"
                    checked={prioritizationEnabled}
                    onCheckedChange={setPrioritizationEnabled}
                  />
                  <label
                    htmlFor="prioritization"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    AI Prioritization
                  </label>
                </div>
              </div>
              <CardDescription>
                {prioritizationEnabled
                  ? "AI is actively prioritizing your tasks based on importance and deadlines"
                  : "Enable AI prioritization for smart task management"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Productivity Insight</p>
                  <p className="text-sm text-muted-foreground">
                    You're most productive between 9 AM and 11 AM. Consider
                    scheduling important tasks during this time.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Star className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Task Optimization</p>
                  <p className="text-sm text-muted-foreground">
                    Breaking down "Project Review" into smaller tasks could
                    improve completion rate by 35%.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tasks Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Tasks Overview</CardTitle>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tasks</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="in-progress" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                  <TabsContent value="in-progress" className="space-y-4">
                    <TaskCard
                      id="1"
                      title="Update Design System"
                      category="Design"
                      priority="High"
                      progress={65}
                      dueTime="2 hours"
                      aiPrioritized={prioritizationEnabled}
                      description="Revise and update the company's design system to ensure consistency across all products."
                      dueDate="2023-07-15"
                    />
                    <TaskCard
                      id="2"
                      title="Client Meeting Preparation"
                      category="Planning"
                      priority="Medium"
                      progress={30}
                      dueTime="5 hours"
                      aiPrioritized={prioritizationEnabled}
                      description="Prepare presentation and talking points for the upcoming client meeting."
                      dueDate="2023-07-14"
                    />
                    <TaskCard
                      id="3"
                      title="Code Review"
                      category="Development"
                      priority="Low"
                      progress={10}
                      dueTime="Tomorrow"
                      aiPrioritized={prioritizationEnabled}
                      description="Review and provide feedback on the latest pull requests from the development team."
                      dueDate="2023-07-16"
                    />
                  </TabsContent>
                  <TabsContent value="completed" className="space-y-4">
                    <TaskCard
                      id="4"
                      title="API Documentation"
                      category="Development"
                      priority="Completed"
                      progress={100}
                      dueTime="Yesterday"
                      completed
                      aiPrioritized={prioritizationEnabled}
                      description="Write comprehensive documentation for the new API endpoints."
                      dueDate="2023-07-13"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Progress & Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Progress & Stats</CardTitle>
                <CardDescription>Your productivity metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Weekly Progress
                    </span>
                    <span className="font-medium">82%</span>
                  </div>
                  <Progress value={82} />
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Quick Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
                      label="Completed"
                      value="24"
                    />
                    <StatCard
                      icon={<Clock className="w-4 h-4 text-blue-500" />}
                      label="In Progress"
                      value="12"
                    />
                    <StatCard
                      icon={<ListTodo className="w-4 h-4 text-primary" />}
                      label="Total Tasks"
                      value="36"
                    />
                    <StatCard
                      icon={<Star className="w-4 h-4 text-yellow-500" />}
                      label="Priority"
                      value="8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// function TaskCard({
//   title,
//   category,
//   priority,
//   progress,
//   dueTime,
//   completed = false,
//   aiPrioritized = false,
// }: {
//   title: string;
//   category: string;
//   priority: string;
//   progress: number;
//   dueTime: string;
//   completed?: boolean;
//   aiPrioritized?: boolean;
// }) {
//   return (
//     <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
//       <div className="flex justify-between items-start mb-3">
//         <div className="flex items-start gap-3">
//           {completed ? (
//             <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
//           ) : (
//             <Circle className="w-4 h-4 text-blue-500 mt-1" />
//           )}
//           <div>
//             <h3 className="font-medium flex items-center gap-2">
//               {title}
//               {aiPrioritized && !completed && (
//                 <Sparkles className="w-3 h-3 text-primary" />
//               )}
//             </h3>
//             <p className="text-sm text-muted-foreground">{category}</p>
//           </div>
//         </div>
//         <span
//           className={`text-xs px-2 py-1 rounded-full ${
//             priority === "High"
//               ? "bg-red-500/20 text-red-500"
//               : priority === "Medium"
//               ? "bg-yellow-500/20 text-yellow-500"
//               : priority === "Completed"
//               ? "bg-green-500/20 text-green-500"
//               : "bg-blue-500/20 text-blue-500"
//           }`}
//         >
//           {priority}
//         </span>
//       </div>
//       <div className="space-y-3">
//         <div className="space-y-1">
//           <div className="flex justify-between text-sm text-muted-foreground">
//             <span>Progress</span>
//             <span>{progress}%</span>
//           </div>
//           <Progress value={progress} />
//         </div>
//         <div className="flex justify-between items-center text-sm">
//           <span className="text-muted-foreground">Due {dueTime}</span>
//           <Button variant="ghost" size="sm">
//             View Details
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
