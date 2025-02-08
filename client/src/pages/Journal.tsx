import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import JournalForm from "@/components/forms/JournalForm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderPlus } from "lucide-react";

export default function Journal() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const { data: journals } = useQuery({
    queryKey: ["/api/journals/1"], // TODO: Replace with actual user ID
  });

  const folders = [...new Set(journals?.map((j: any) => j.folder))].filter(Boolean);

  return (
    <div className="h-full flex gap-6">
      <div className="w-64 flex flex-col gap-4">
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
          <h1 className="text-3xl font-bold">Daily Journal</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <JournalForm />
          </Dialog>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-4">
            {journals
              ?.filter((j: any) => !selectedFolder || j.folder === selectedFolder)
              .map((journal: any) => (
                <Card key={journal.id} className="p-6">
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
  );
}
