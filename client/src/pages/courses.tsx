import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  BookOpen, 
  Search, 
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Clock,
  Star,
  Filter,
  Loader2
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
import type { Course, SavedCourse } from "@shared/schema";

const platformColors: Record<string, string> = {
  YouTube: "bg-red-500",
  Coursera: "bg-blue-500",
  edX: "bg-red-600",
  Udemy: "bg-purple-600",
  "freeCodeCamp": "bg-green-600",
};

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: savedCourses = [] } = useQuery<SavedCourse[]>({
    queryKey: ["/api/saved-courses"],
  });

  const saveMutation = useMutation({
    mutationFn: (courseId: number) => apiRequest("POST", "/api/saved-courses", { courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Course saved!" });
    },
    onError: () => {
      toast({ title: "Failed to save course", variant: "destructive" });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (courseId: number) => apiRequest("DELETE", `/api/saved-courses/${courseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Course removed from saved" });
    },
    onError: () => {
      toast({ title: "Failed to remove course", variant: "destructive" });
    },
  });

  const savedCourseIds = new Set(savedCourses.map((sc) => sc.courseId));

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLevel = levelFilter === "all" || course.level === levelFilter;
    const matchesPrice = priceFilter === "all" || 
      (priceFilter === "free" && course.isFree) ||
      (priceFilter === "paid" && !course.isFree);

    return matchesSearch && matchesLevel && matchesPrice;
  });

  const freeCourses = filteredCourses.filter((c) => c.isFree);
  const paidCourses = filteredCourses.filter((c) => !c.isFree);

  if (isLoading) {
    return <CoursesSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Learning Resources</h1>
          <p className="text-muted-foreground">Curated courses to advance your career</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search courses by title, description, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-courses"
          />
        </div>
        <div className="flex gap-2">
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-level-filter">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-[120px]" data-testid="select-price-filter">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-courses">
            All ({filteredCourses.length})
          </TabsTrigger>
          <TabsTrigger value="free" data-testid="tab-free-courses">
            Free ({freeCourses.length})
          </TabsTrigger>
          <TabsTrigger value="paid" data-testid="tab-paid-courses">
            Paid ({paidCourses.length})
          </TabsTrigger>
          <TabsTrigger value="saved" data-testid="tab-saved-courses">
            Saved ({savedCourses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <CourseGrid 
            courses={filteredCourses} 
            savedIds={savedCourseIds}
            onSave={(id) => saveMutation.mutate(id)}
            onUnsave={(id) => unsaveMutation.mutate(id)}
            isPending={saveMutation.isPending || unsaveMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="free">
          <CourseGrid 
            courses={freeCourses} 
            savedIds={savedCourseIds}
            onSave={(id) => saveMutation.mutate(id)}
            onUnsave={(id) => unsaveMutation.mutate(id)}
            isPending={saveMutation.isPending || unsaveMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="paid">
          <CourseGrid 
            courses={paidCourses} 
            savedIds={savedCourseIds}
            onSave={(id) => saveMutation.mutate(id)}
            onUnsave={(id) => unsaveMutation.mutate(id)}
            isPending={saveMutation.isPending || unsaveMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="saved">
          <CourseGrid 
            courses={courses.filter((c) => savedCourseIds.has(c.id))} 
            savedIds={savedCourseIds}
            onSave={(id) => saveMutation.mutate(id)}
            onUnsave={(id) => unsaveMutation.mutate(id)}
            isPending={saveMutation.isPending || unsaveMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CourseGrid({ 
  courses, 
  savedIds,
  onSave,
  onUnsave,
  isPending
}: { 
  courses: Course[];
  savedIds: Set<number>;
  onSave: (id: number) => void;
  onUnsave: (id: number) => void;
  isPending: boolean;
}) {
  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No courses found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          isSaved={savedIds.has(course.id)}
          onSave={() => onSave(course.id)}
          onUnsave={() => onUnsave(course.id)}
          isPending={isPending}
        />
      ))}
    </div>
  );
}

function CourseCard({ 
  course, 
  isSaved,
  onSave,
  onUnsave,
  isPending
}: { 
  course: Course;
  isSaved: boolean;
  onSave: () => void;
  onUnsave: () => void;
  isPending: boolean;
}) {
  const platformColor = platformColors[course.platform] || "bg-gray-500";

  return (
    <Card className="flex flex-col" data-testid={`course-card-${course.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${platformColor} flex items-center justify-center`}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <Badge variant={course.isFree ? "default" : "secondary"}>
              {course.isFree ? "Free" : "Paid"}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={isSaved ? onUnsave : onSave}
            disabled={isPending}
            data-testid={`button-save-course-${course.id}`}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 text-primary" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </Button>
        </div>
        <CardTitle className="text-base line-clamp-2 mt-2">{course.title}</CardTitle>
        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {course.skills.slice(0, 3).map((skill, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {course.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{course.skills.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="text-xs font-medium">{course.platform}</span>
            {course.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {course.duration}
              </div>
            )}
            {course.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                {course.rating}
              </div>
            )}
          </div>

          <Badge variant="secondary" className="text-xs">
            {course.level}
          </Badge>
        </div>

        <a 
          href={course.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-4"
        >
          <Button variant="outline" className="w-full gap-2" size="sm" data-testid={`button-view-course-${course.id}`}>
            View Course
            <ExternalLink className="w-3 h-3" />
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}

function CoursesSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-5 w-12" />
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
