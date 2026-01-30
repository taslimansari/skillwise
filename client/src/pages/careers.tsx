import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Compass, 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  DollarSign,
  CheckCircle2,
  Target,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CareerPath, Skill } from "@shared/schema";
import { useLocation } from "wouter";

export default function CareersPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: careerPaths = [], isLoading } = useQuery<CareerPath[]>({
    queryKey: ["/api/career-paths"],
  });

  const { data: skills = [] } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/career-paths/generate"),
    onMutate: () => setIsGenerating(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/career-paths"] });
      toast({ title: "Career paths generated!" });
    },
    onError: () => {
      toast({ title: "Failed to generate recommendations", variant: "destructive" });
    },
    onSettled: () => setIsGenerating(false),
  });

  const selectCareerMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/career-paths/${id}/select`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/career-paths"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roadmaps"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Career path selected! Generating your roadmap..." });
      setTimeout(() => navigate("/roadmap"), 1500);
    },
    onError: () => {
      toast({ title: "Failed to select career path", variant: "destructive" });
    },
  });

  const selectedCareer = careerPaths.find(cp => cp.isSelected);

  if (isLoading) {
    return <CareersSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Career Recommendations</h1>
          <p className="text-muted-foreground">AI-powered career path suggestions based on your skills</p>
        </div>
        <Button 
          onClick={() => generateMutation.mutate()} 
          disabled={isGenerating || skills.length === 0}
          className="gap-2"
          data-testid="button-generate-careers"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : careerPaths.length > 0 ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {careerPaths.length > 0 ? "Regenerate" : "Generate Recommendations"}
        </Button>
      </div>

      {skills.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Add skills first</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We need to know your skills to recommend suitable career paths. 
              Add skills manually or upload your resume.
            </p>
            <Button onClick={() => navigate("/skills")} className="gap-2" data-testid="button-go-to-skills">
              <ArrowRight className="w-4 h-4" />
              Go to Skills
            </Button>
          </CardContent>
        </Card>
      ) : careerPaths.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Compass className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No career recommendations yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Click the button above to generate AI-powered career recommendations 
              based on your {skills.length} skills.
            </p>
            <Button 
              onClick={() => generateMutation.mutate()} 
              disabled={isGenerating}
              className="gap-2"
              data-testid="button-generate-first"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate Recommendations
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {careerPaths.map((career) => (
            <CareerPathCard
              key={career.id}
              career={career}
              isSelected={career.isSelected || false}
              onSelect={() => selectCareerMutation.mutate(career.id)}
              isSelecting={selectCareerMutation.isPending}
            />
          ))}
        </div>
      )}

      {selectedCareer && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Selected Career Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedCareer.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedCareer.matchPercentage}% skill match</p>
              </div>
              <Button onClick={() => navigate("/roadmap")} className="gap-2" data-testid="button-view-roadmap">
                View Your Roadmap
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CareerPathCard({ 
  career, 
  isSelected, 
  onSelect,
  isSelecting
}: { 
  career: CareerPath; 
  isSelected: boolean;
  onSelect: () => void;
  isSelecting: boolean;
}) {
  return (
    <Card className={isSelected ? "border-primary ring-1 ring-primary" : ""}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle data-testid={`career-title-${career.id}`}>{career.title}</CardTitle>
              {isSelected && (
                <Badge className="bg-green-500 gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Selected
                </Badge>
              )}
            </div>
            <CardDescription className="text-base">{career.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-medium">
                <TrendingUp className="w-4 h-4 text-green-500" />
                {career.matchPercentage}% Match
              </div>
              <Progress value={career.matchPercentage} className="w-24 h-2 mt-1" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Why this suits you:</h4>
          <ul className="space-y-1">
            {career.matchReasons.map((reason, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Required Skills:</h4>
          <div className="flex flex-wrap gap-2">
            {career.requiredSkills.map((skill, i) => (
              <Badge key={i} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          {career.salaryRange && (
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span>{career.salaryRange}</span>
            </div>
          )}
          {career.demandLevel && (
            <Badge 
              variant={career.demandLevel === "High" ? "default" : "secondary"}
            >
              {career.demandLevel} Demand
            </Badge>
          )}
        </div>

        {!isSelected && (
          <Button 
            onClick={onSelect} 
            className="w-full gap-2 mt-4"
            disabled={isSelecting}
            data-testid={`button-select-career-${career.id}`}
          >
            {isSelecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Target className="w-4 h-4" />
            )}
            Select This Career Path
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function CareersSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="grid gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="h-6 w-20" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
