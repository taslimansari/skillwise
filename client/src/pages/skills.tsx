import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Brain, 
  Plus, 
  Upload, 
  Trash2, 
  FileText, 
  Loader2,
  Sparkles,
  Code,
  Wrench,
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Skill } from "@shared/schema";

const addSkillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  category: z.enum(["technical", "tools", "soft"]),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]),
});

type AddSkillInput = z.infer<typeof addSkillSchema>;

const categoryInfo = {
  technical: { icon: Code, label: "Technical", color: "bg-blue-500" },
  tools: { icon: Wrench, label: "Tools", color: "bg-purple-500" },
  soft: { icon: Users, label: "Soft Skills", color: "bg-green-500" },
};

export default function SkillsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const { data: skills = [], isLoading } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  const form = useForm<AddSkillInput>({
    resolver: zodResolver(addSkillSchema),
    defaultValues: { name: "", category: "technical", proficiency: "intermediate" },
  });

  const addSkillMutation = useMutation({
    mutationFn: (data: AddSkillInput) => apiRequest("POST", "/api/skills", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      setIsAddOpen(false);
      toast({ title: "Skill added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add skill", variant: "destructive" });
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/skills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Skill removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove skill", variant: "destructive" });
    },
  });

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf")) {
      toast({ title: "Please upload a PDF file", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("/api/skills/extract", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ 
        title: "Skills extracted!", 
        description: `Found ${data.extractedCount} skills from your resume` 
      });
    } catch (error) {
      toast({ title: "Failed to extract skills", variant: "destructive" });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const technicalSkills = skills.filter((s) => s.category === "technical");
  const toolSkills = skills.filter((s) => s.category === "tools");
  const softSkills = skills.filter((s) => s.category === "soft");

  if (isLoading) {
    return <SkillsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Skills</h1>
          <p className="text-muted-foreground">Manage your skills and competencies</p>
        </div>
        <div className="flex gap-2">
          <label htmlFor="resume-upload">
            <Button 
              variant="outline" 
              className="gap-2 cursor-pointer" 
              disabled={isUploading}
              asChild
            >
              <span>
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Resume
              </span>
            </Button>
          </label>
          <input
            id="resume-upload"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleResumeUpload}
            data-testid="input-resume-upload"
          />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-skill">
                <Plus className="w-4 h-4" />
                Add Skill
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Skill</DialogTitle>
                <DialogDescription>
                  Add a skill to your profile to get better career recommendations
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => addSkillMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., JavaScript, Python, Project Management"
                            data-testid="input-skill-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-skill-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="technical">Technical Skills</SelectItem>
                            <SelectItem value="tools">Tools & Technologies</SelectItem>
                            <SelectItem value="soft">Soft Skills</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="proficiency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proficiency Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-skill-proficiency">
                              <SelectValue placeholder="Select proficiency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addSkillMutation.isPending}
                      data-testid="button-save-skill"
                    >
                      {addSkillMutation.isPending && (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      )}
                      Add Skill
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {skills.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Brain className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No skills added yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add your skills manually or upload your resume to automatically extract skills using AI
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setIsAddOpen(true)} className="gap-2" data-testid="button-add-first-skill">
                <Plus className="w-4 h-4" />
                Add Skill Manually
              </Button>
              <label htmlFor="resume-upload-empty">
                <Button variant="outline" className="gap-2 cursor-pointer" asChild>
                  <span>
                    <FileText className="w-4 h-4" />
                    Upload Resume (PDF)
                  </span>
                </Button>
              </label>
              <input
                id="resume-upload-empty"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleResumeUpload}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <SkillCategoryCard
            title="Technical Skills"
            description="Programming languages, frameworks, and methodologies"
            icon={Code}
            color="bg-blue-500"
            skills={technicalSkills}
            onDelete={(id) => deleteSkillMutation.mutate(id)}
          />
          <SkillCategoryCard
            title="Tools & Technologies"
            description="Software, platforms, and development tools"
            icon={Wrench}
            color="bg-purple-500"
            skills={toolSkills}
            onDelete={(id) => deleteSkillMutation.mutate(id)}
          />
          <SkillCategoryCard
            title="Soft Skills"
            description="Communication, leadership, and interpersonal skills"
            icon={Users}
            color="bg-green-500"
            skills={softSkills}
            onDelete={(id) => deleteSkillMutation.mutate(id)}
          />
        </div>
      )}

      {skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Skill Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-primary">{skills.length}</div>
                <div className="text-sm text-muted-foreground">Total Skills</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-blue-500">{technicalSkills.length}</div>
                <div className="text-sm text-muted-foreground">Technical</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-purple-500">{toolSkills.length}</div>
                <div className="text-sm text-muted-foreground">Tools</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-green-500">{softSkills.length}</div>
                <div className="text-sm text-muted-foreground">Soft Skills</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SkillCategoryCard({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  skills, 
  onDelete 
}: {
  title: string;
  description: string;
  icon: any;
  color: string;
  skills: Skill[];
  onDelete: (id: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No skills in this category</p>
        ) : (
          <div className="space-y-2">
            {skills.map((skill) => (
              <div 
                key={skill.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 group"
                data-testid={`skill-item-${skill.id}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{skill.name}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {skill.proficiency}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                  onClick={() => onDelete(skill.id)}
                  data-testid={`button-delete-skill-${skill.id}`}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SkillsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
