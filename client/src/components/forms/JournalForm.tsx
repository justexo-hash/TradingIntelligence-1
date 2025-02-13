import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertJournalSchema, type InsertJournal } from "@shared/schema";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const folders = [
  { value: "daily", label: "Daily Reviews" },
  { value: "weekly", label: "Weekly Reviews" },
  { value: "monthly", label: "Monthly Reviews" },
  { value: "lessons", label: "Lessons Learned" },
  { value: "strategies", label: "Trading Strategies" },
];

export default function JournalForm() {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<InsertJournal>({
    resolver: zodResolver(insertJournalSchema),
    defaultValues: {
      userId: user?.id || 0,
      title: "",
      content: "",
      folder: "",
    },
  });

  const journalMutation = useMutation({
    mutationFn: async (data: InsertJournal) => {
      const response = await apiRequest("POST", "/api/journals", data);
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      toast({
        title: "Success",
        description: "Journal entry saved successfully.",
      });
      form.reset();
      const closeButton = document.querySelector('[data-button="close"]');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }
    },
    onError: (error: Error) => {
      console.error("Failed to save journal entry:", error);
      toast({
        title: "Error",
        description: "Failed to save journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertJournal) => {
    console.log("Submitting journal data:", data);
    journalMutation.mutate({
      ...data,
      userId: user?.id || 0,
    });
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>New Journal Entry</DialogTitle>
        <DialogDescription>
          Record your thoughts and observations about your trading day.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Trading Day Summary" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="folder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Folder</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a folder" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder.value} value={folder.value}>
                        {folder.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write your journal entry here..."
                    className="min-h-[200px]"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" data-button="close">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={journalMutation.isPending}
              className="bg-gradient-to-r from-[rgb(var(--solana-green))] to-[rgb(var(--solana-purple))] hover:opacity-90"
            >
              {journalMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Entry
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}