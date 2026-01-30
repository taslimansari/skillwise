import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  FolderGit2, 
  Search, 
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Clock,
  CheckCircle2,
  Github
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Project, SavedProject } from "@shared/schema";

const difficultyColors: Record<string, string> = {
  Easy: "bg-green-500",
  Medium: "bg-yellow-500",
  Hard: "bg-red-500",
};

const phaseColors: Record<string, string> = {
  Beginner: "text-green-500",
  Intermediate: "text-blue-500",
  Advanced: "text-purple-500",
};

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: savedProjects = [] } = useQuery<SavedProject[]>({
    queryKey: ["/api/saved-projects"],
  });

  const saveMutation = useMutation({
    mutationFn: (projectId: number) => apiRequest("POST", "/api/saved-projects", { projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Project saved!" });
    },
    onError: () => {
      toast({ title: "Failed to save project", variant: "destructive" });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (projectId: number) => apiRequest("DELETE", `/api/saved-projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Project removed from saved" });
    },
    onError: () => {
      toast({ title: "Failed to remove project", variant: "destructive" });
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ projectId, isCompleted }: { projectId: number; isCompleted: boolean }) =>
      apiRequest("PATCH", `/api/saved-projects/${projectId}`, { isCompleted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => {
      toast({ title: "Failed to update project", variant: "destructive" });
    },
  });

  const savedProjectMap = new Map(savedProjects.map((sp) => [sp.projectId, sp]));

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDifficulty = difficultyFilter === "all" || project.difficulty === difficultyFilter;
    const matchesPhase = phaseFilter === "all" || project.phase === phaseFilter;

    return matchesSearch && matchesDifficulty && matchesPhase;
  });

  if (isLoading) {
    return <ProjectsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Project Ideas</h1>
          <p className="text-muted-foreground">Hands-on projects to build your portfolio</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by title, description, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-projects"
          />
        </div>
        <div className="flex gap-2">
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[130px]" data-testid="select-difficulty-filter">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={phaseFilter} onValueChange={setPhaseFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-phase-filter">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-projects">
            All ({filteredProjects.length})
          </TabsTrigger>
          <TabsTrigger value="saved" data-testid="tab-saved-projects">
            Saved ({savedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed-projects">
            Completed ({savedProjects.filter((sp) => sp.isCompleted).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ProjectGrid 
            projects={filteredProjects} 
            savedMap={savedProjectMap}
            onSave={(id) => saveMutation.mutate(id)}
            onUnsave={(id) => unsaveMutation.mutate(id)}
            onToggleComplete={(id, completed) => toggleCompleteMutation.mutate({ projectId: id, isCompleted: completed })}
            isPending={saveMutation.isPending || unsaveMutation.isPending || toggleCompleteMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="saved">
          <ProjectGrid 
            projects={projects.filter((p) => savedProjectMap.has(p.id))} 
            savedMap={savedProjectMap}
            onSave={(id) => saveMutation.mutate(id)}
            onUnsave={(id) => unsaveMutation.mutate(id)}
            onToggleComplete={(id, completed) => toggleCompleteMutation.mutate({ projectId: id, isCompleted: completed })}
            isPending={saveMutation.isPending || unsaveMutation.isPending || toggleCompleteMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="completed">
          <ProjectGrid 
            projects={projects.filter((p) => savedProjectMap.get(p.id)?.isCompleted)} 
            savedMap={savedProjectMap}
            onSave={(id) => saveMutation.mutate(id)}
            onUnsave={(id) => unsaveMutation.mutate(id)}
            onToggleComplete={(id, completed) => toggleCompleteMutation.mutate({ projectId: id, isCompleted: completed })}
            isPending={saveMutation.isPending || unsaveMutation.isPending || toggleCompleteMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectGrid({ 
  projects, 
  savedMap,
  onSave,
  onUnsave,
  onToggleComplete,
  isPending
}: { 
  projects: Project[];
  savedMap: Map<number, SavedProject>;
  onSave: (id: number) => void;
  onUnsave: (id: number) => void;
  onToggleComplete: (id: number, completed: boolean) => void;
  isPending: boolean;
}) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FolderGit2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No projects found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          savedProject={savedMap.get(project.id)}
          onSave={() => onSave(project.id)}
          onUnsave={() => onUnsave(project.id)}
          onToggleComplete={(completed) => onToggleComplete(project.id, completed)}
          isPending={isPending}
        />
      ))}
    </div>
  );
}

function ProjectCard({ 
  project, 
  savedProject,
  onSave,
  onUnsave,
  onToggleComplete,
  isPending
}: { 
  project: Project;
  savedProject?: SavedProject;
  onSave: () => void;
  onUnsave: () => void;
  onToggleComplete: (completed: boolean) => void;
  isPending: boolean;
}) {
  const isSaved = !!savedProject;
  const isCompleted = savedProject?.isCompleted || false;
  const difficultyColor = difficultyColors[project.difficulty] || "bg-gray-500";
  const phaseColor = phaseColors[project.phase] || "text-gray-500";

  return (
    <Card className={`flex flex-col ${isCompleted ? "opacity-75" : ""}`} data-testid={`project-card-${project.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center`}>
              <FolderGit2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${difficultyColor}`} />
              <span className="text-xs text-muted-foreground">{project.difficulty}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isSaved && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleComplete(!isCompleted)}
                disabled={isPending}
                data-testid={`button-complete-project-${project.id}`}
              >
                <CheckCircle2 className={`w-4 h-4 ${isCompleted ? "text-green-500" : "text-muted-foreground"}`} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={isSaved ? onUnsave : onSave}
              disabled={isPending}
              data-testid={`button-save-project-${project.id}`}
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-primary" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <CardTitle className={`text-base line-clamp-2 mt-2 ${isCompleted ? "line-through" : ""}`}>
          {project.title}
        </CardTitle>
        <CardDescription className="line-clamp-2">{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {project.skills.slice(0, 4).map((skill, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {project.skills.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{project.skills.length - 4}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className={`text-xs font-medium ${phaseColor}`}>{project.phase}</span>
            {project.estimatedTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {project.estimatedTime}
              </div>
            )}
          </div>
        </div>

        {project.githubUrl && (
          <a 
            href={project.githubUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-4"
          >
            <Button variant="outline" className="w-full gap-2" size="sm" data-testid={`button-view-project-${project.id}`}>
              <Github className="w-3 h-3" />
              View on GitHub
              <ExternalLink className="w-3 h-3" />
            </Button>
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56 mt-2" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-5 w-full mt-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-5 w-16" />
                ))}
              </div>
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
