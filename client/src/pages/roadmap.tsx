import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Map, 
  CheckCircle2, 
  Circle,
  Clock,
  Loader2,
  Target,
  ArrowRight,
  GraduationCap,
  Rocket,
  Award
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Roadmap, RoadmapStep, CareerPath } from "@shared/schema";
import { useLocation } from "wouter";

interface RoadmapWithSteps extends Roadmap {
  steps: RoadmapStep[];
  careerPath?: CareerPath;
}

const phaseConfig = {
  Beginner: { icon: GraduationCap, color: "bg-green-500", textColor: "text-green-500" },
  Intermediate: { icon: Rocket, color: "bg-blue-500", textColor: "text-blue-500" },
  Advanced: { icon: Award, color: "bg-purple-500", textColor: "text-purple-500" },
};

export default function RoadmapPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: roadmap, isLoading } = useQuery<RoadmapWithSteps>({
    queryKey: ["/api/roadmaps/current"],
  });

  const toggleStepMutation = useMutation({
    mutationFn: ({ stepId, completed }: { stepId: number; completed: boolean }) =>
      apiRequest("PATCH", `/api/roadmap-steps/${stepId}`, { isCompleted: completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roadmaps/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => {
      toast({ title: "Failed to update step", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <RoadmapSkeleton />;
  }

  if (!roadmap) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Map className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No roadmap generated yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Select a career path to generate your personalized learning roadmap
            </p>
            <Button onClick={() => navigate("/careers")} className="gap-2" data-testid="button-go-to-careers">
              <Target className="w-4 h-4" />
              Explore Career Paths
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedSteps = roadmap.steps.filter((s) => s.isCompleted).length;
  const totalSteps = roadmap.steps.length;
  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const beginnerSteps = roadmap.steps.filter((s) => s.phase === "Beginner");
  const intermediateSteps = roadmap.steps.filter((s) => s.phase === "Intermediate");
  const advancedSteps = roadmap.steps.filter((s) => s.phase === "Advanced");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{roadmap.title}</h1>
          <p className="text-muted-foreground">{roadmap.description}</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold" data-testid="text-career-goal">
                  {roadmap.careerPath?.title || "Career Path"}
                </h3>
                <p className="text-sm text-muted-foreground">Your career goal</p>
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-3xl font-bold text-primary" data-testid="text-progress">
                {progressPercentage}%
              </div>
              <p className="text-sm text-muted-foreground">
                {completedSteps} of {totalSteps} steps completed
              </p>
              <Progress value={progressPercentage} className="w-48 h-2 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <PhaseSection
          phase="Beginner"
          steps={beginnerSteps}
          onToggle={(stepId, completed) => toggleStepMutation.mutate({ stepId, completed })}
          isUpdating={toggleStepMutation.isPending}
        />
        <PhaseSection
          phase="Intermediate"
          steps={intermediateSteps}
          onToggle={(stepId, completed) => toggleStepMutation.mutate({ stepId, completed })}
          isUpdating={toggleStepMutation.isPending}
        />
        <PhaseSection
          phase="Advanced"
          steps={advancedSteps}
          onToggle={(stepId, completed) => toggleStepMutation.mutate({ stepId, completed })}
          isUpdating={toggleStepMutation.isPending}
        />
      </div>

      {progressPercentage === 100 && (
        <Card className="border-green-500 bg-green-500/5">
          <CardContent className="py-8 text-center">
            <Award className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Congratulations!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You've completed your learning roadmap! You're now ready to pursue your career as a {roadmap.careerPath?.title}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PhaseSection({ 
  phase, 
  steps, 
  onToggle,
  isUpdating
}: { 
  phase: "Beginner" | "Intermediate" | "Advanced";
  steps: RoadmapStep[];
  onToggle: (stepId: number, completed: boolean) => void;
  isUpdating: boolean;
}) {
  const config = phaseConfig[phase];
  const Icon = config.icon;
  const completedCount = steps.filter((s) => s.isCompleted).length;

  if (steps.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            {phase} Phase
          </CardTitle>
          <Badge variant="secondary">
            {completedCount}/{steps.length} completed
          </Badge>
        </div>
        <CardDescription>
          {phase === "Beginner" && "Build your foundation with essential skills"}
          {phase === "Intermediate" && "Deepen your knowledge and practical experience"}
          {phase === "Advanced" && "Master advanced concepts and specialize"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                step.isCompleted ? "bg-muted/50 border-transparent" : "hover-elevate cursor-pointer"
              }`}
              onClick={() => !isUpdating && onToggle(step.id, !step.isCompleted)}
              data-testid={`roadmap-step-${step.id}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {step.isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <Circle className={`w-6 h-6 ${config.textColor}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`font-medium ${step.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                    {step.title}
                  </h4>
                  {step.duration && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {step.duration}
                    </div>
                  )}
                </div>
                <p className={`text-sm mt-1 ${step.isCompleted ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                  {step.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {step.skills.map((skill, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24 mt-1" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-10 w-16 ml-auto" />
              <Skeleton className="h-4 w-32 mt-1 ml-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
