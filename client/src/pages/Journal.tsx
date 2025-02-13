import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import JournalForm from "@/components/forms/JournalForm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Journal } from "@shared/schema";

export default function Journal() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const { user } = useAuth();

  const { data: journals } = useQuery<Journal[]>({
    queryKey: [`/api/journals/${user?.id}`],
    enabled: !!user,
  });

  const folders = journals 
    ? [...new Set(journals.map((j) => j.folder).filter(Boolean))]
    : [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex gap-6">
        <div className="w-64 hidden md:flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Folders</h2>
          <div className="space-y-2">
            <Button
              variant={selectedFolder === null ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedFolder(null)}
            >
              All Entries
            </Button>
            {folders.map((folder) => (
              <Button
                key={folder}
                variant={selectedFolder === folder ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedFolder(folder)}
              >
                {folder}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold md:text-4xl text-[#00ff99] [text-shadow:0_0_10px_#00ff99,0_0_20px_#00ff99,0_0_30px_#00ff99]">Daily Journal</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[rgb(var(--solana-green))] to-[rgb(var(--solana-purple))] hover:opacity-90">
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Entry
                </Button>
              </DialogTrigger>
              <JournalForm />
            </Dialog>
          </div>

          {/* Mobile Folder Selection */}
          <div className="md:hidden">
            <select
              className="w-full p-2 rounded-md bg-black/60 backdrop-blur-sm border-none"
              value={selectedFolder || ""}
              onChange={(e) => setSelectedFolder(e.target.value || null)}
            >
              <option value="">All Entries</option>
              {folders.map((folder) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </select>
          </div>

          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="grid gap-4">
              {journals
                ?.filter((j) => !selectedFolder || j.folder === selectedFolder)
                .map((journal) => (
                  <Card key={journal.id} className="p-6 bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg border-none">
                    <h3 className="text-xl font-semibold mb-2">{journal.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {new Date(journal.date).toLocaleDateString()}
                    </p>
                    <p className="whitespace-pre-wrap">{journal.content}</p>
                  </Card>
                ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}