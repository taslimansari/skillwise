import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Brain, 
  Map, 
  BookOpen, 
  FolderGit2, 
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import type { Skill, CareerPath, RoadmapStep, SavedCourse, SavedProject } from "@shared/schema";

interface DashboardStats {
  skills: Skill[];
  careerPaths: CareerPath[];
  roadmapSteps: RoadmapStep[];
  savedCourses: SavedCourse[];
  savedProjects: SavedProject[];
  completedSteps: number;
  totalSteps: number;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const progressPercentage = stats?.totalSteps 
    ? Math.round((stats.completedSteps / stats.totalSteps) * 100) 
    : 0;

  const selectedCareer = stats?.careerPaths.find(cp => cp.isSelected);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">Track your career development progress</p>
        </div>
        {!selectedCareer && (
          <Link href="/careers">
            <Button className="gap-2" data-testid="button-get-started">
              <Sparkles className="w-4 h-4" />
              Get Career Recommendations
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
            <Brain className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-skills-count">
              {stats?.skills.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.skills.filter(s => s.category === "technical").length || 0} technical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Roadmap Progress</CardTitle>
            <Map className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-progress-percentage">
              {progressPercentage}%
            </div>
            <Progress value={progressPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Saved Courses</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-courses-count">
              {stats?.savedCourses.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Ready to learn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Saved Projects</CardTitle>
            <FolderGit2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-projects-count">
              {stats?.savedProjects.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">To build</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {selectedCareer ? (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Current Career Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold" data-testid="text-career-title">
                    {selectedCareer.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCareer.description}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{selectedCareer.matchPercentage}% match</span>
                  </div>
                  {selectedCareer.demandLevel && (
                    <Badge variant="secondary">{selectedCareer.demandLevel} demand</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCareer.requiredSkills.slice(0, 5).map((skill, i) => (
                    <Badge key={i} variant="outline">{skill}</Badge>
                  ))}
                </div>
                <Link href="/roadmap">
                  <Button variant="outline" className="w-full gap-2" data-testid="button-view-roadmap">
                    View Learning Roadmap
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Complete these steps to unlock your career potential</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Link href="/skills">
                  <div className="flex items-center gap-4 p-3 rounded-lg border hover-elevate cursor-pointer" data-testid="card-add-skills">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Add Your Skills</h4>
                      <p className="text-sm text-muted-foreground">Input skills or upload resume</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
                <Link href="/careers">
                  <div className="flex items-center gap-4 p-3 rounded-lg border hover-elevate cursor-pointer" data-testid="card-explore-careers">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Explore Careers</h4>
                      <p className="text-sm text-muted-foreground">Get AI-powered recommendations</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Roadmap Progress
            </CardTitle>
            <CardDescription>Your current learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.roadmapSteps && stats.roadmapSteps.length > 0 ? (
              <div className="space-y-3">
                {stats.roadmapSteps.slice(0, 4).map((step) => (
                  <div 
                    key={step.id} 
                    className="flex items-center gap-3 p-2 rounded-lg"
                    data-testid={`roadmap-step-${step.id}`}
                  >
                    {step.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${step.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.phase}</p>
                    </div>
                  </div>
                ))}
                <Link href="/roadmap">
                  <Button variant="ghost" className="w-full mt-2" size="sm" data-testid="button-view-all-steps">
                    View all steps
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Map className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No roadmap yet</p>
                <p className="text-sm text-muted-foreground">Select a career path to generate your roadmap</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Skills</CardTitle>
              <CardDescription>Skills you've added to your profile</CardDescription>
            </div>
            <Link href="/skills">
              <Button variant="ghost" size="sm" data-testid="button-manage-skills">
                Manage
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.skills && stats.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stats.skills.slice(0, 12).map((skill) => (
                  <Badge 
                    key={skill.id} 
                    variant={skill.category === "technical" ? "default" : skill.category === "tools" ? "secondary" : "outline"}
                    data-testid={`badge-skill-${skill.id}`}
                  >
                    {skill.name}
                  </Badge>
                ))}
                {stats.skills.length > 12 && (
                  <Badge variant="outline">+{stats.skills.length - 12} more</Badge>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No skills added yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Saved Courses</CardTitle>
              <CardDescription>Courses bookmarked for learning</CardDescription>
            </div>
            <Link href="/courses">
              <Button variant="ghost" size="sm" data-testid="button-browse-courses">
                Browse
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.savedCourses && stats.savedCourses.length > 0 ? (
              <div className="space-y-3">
                {stats.savedCourses.slice(0, 3).map((sc: any) => (
                  <div key={sc.id} className="flex items-center gap-3" data-testid={`saved-course-${sc.id}`}>
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sc.course?.title || "Course"}</p>
                      <p className="text-xs text-muted-foreground">{sc.course?.platform || "Platform"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No courses saved yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
