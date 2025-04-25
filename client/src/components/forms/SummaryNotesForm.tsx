import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  upsertTokenSummarySchema, 
  type UpsertTokenSummary,
  type TokenSummary,
} from "@shared/schema";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Reuse options (consider moving to shared location later)
const setupOptions = [
  "Fast Volume", "Good Socials", "Shared in groups", "Good Art",
  "Narrative / Meta", "Derivative / Correlation of another asset",
  "Decent MC Entry", "Technical Analysis Indication", "Wallet Tracking", "Other",
];
const emotionOptions = [
  "Anxious", "Excited", "Fearful", "Bullish", "Bearish",
  "Relaxed", "Indifferent", "Bored", "Annoyed", "Sad", "Other",
];
const mistakeOptions = [
  "No Mistakes", "Overbought", "Underbought", "Oversold", "Undersold",
  "Setup Oversight", "Distracted", "Too little volume",
  "Trying to be too perfect", "Other",
];

interface SummaryNotesFormProps {
  userId: number;
  contractAddress: string;
  tokenName?: string | null;
  onClose: () => void;
}

// Define the shape of the form data
type SummaryFormData = Pick<UpsertTokenSummary, 'notes' | 'setup' | 'emotion' | 'mistakes'>;

// Use the upsert schema, picking only the editable fields for validation
const summaryFormValidationSchema = upsertTokenSummarySchema.pick({
    notes: true, setup: true, emotion: true, mistakes: true
});

export default function SummaryNotesForm({ userId, contractAddress, tokenName, onClose }: SummaryNotesFormProps) {
  const { toast } = useToast();
  const [customSetup, setCustomSetup] = useState("");
  const [customEmotion, setCustomEmotion] = useState("");
  const [customMistake, setCustomMistake] = useState("");

  // Fetch existing summary data
  const { data: existingSummary, isLoading: isLoadingSummary } = useQuery<TokenSummary>({
      queryKey: [`/api/trades/summary/${contractAddress}`],
      enabled: !!userId && !!contractAddress, 
      retry: 1,
  });

  const form = useForm<SummaryFormData>({
    resolver: zodResolver(summaryFormValidationSchema),
    defaultValues: {
      notes: '', 
      setup: [],
      emotion: [],
      mistakes: [],
    }
  });

  // Effect to populate form once existing data loads
  useEffect(() => {
    if (existingSummary) {
      form.reset({
        notes: existingSummary.notes || '',
        setup: existingSummary.setup || [],
        emotion: existingSummary.emotion || [],
        mistakes: existingSummary.mistakes || [],
      });
      // Initialize custom fields based on loaded data
      const currentSetup = existingSummary.setup || [];
      const currentEmotion = existingSummary.emotion || [];
      const currentMistakes = existingSummary.mistakes || [];
      setCustomSetup( currentSetup.includes("Other") ? (currentSetup.find(s => !setupOptions.includes(s)) || "") : "");
      setCustomEmotion( currentEmotion.includes("Other") ? (currentEmotion.find(e => !emotionOptions.includes(e)) || "") : "");
      setCustomMistake( currentMistakes.includes("Other") ? (currentMistakes.find(m => !mistakeOptions.includes(m)) || "") : "");
    }
  }, [existingSummary, form]);

  // Mutation to save the summary data
  const upsertSummaryMutation = useMutation({
      mutationFn: async (data: UpsertTokenSummary) => {
          const response = await apiRequest("PATCH", `/api/trades/summary/${data.contractAddress}`, data);
          return response.json();
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [`/api/trades/summary/${contractAddress}`] }); // Refetch this summary
          queryClient.invalidateQueries({ queryKey: ['/api/trades/grouped'] }); // Invalidate grouped view
          toast({ title: "Success", description: `Summary notes updated.` });
          onClose(); // Close the dialog on success
      },
      onError: (error: any) => {
          const message = error?.response?.data?.error || "Failed to save summary.";
          toast({ title: "Error", description: message, variant: "destructive" });
      }
  });

  // Submit handler
  const onSubmit = (formData: SummaryFormData) => {
    const combineOptions = (options: string[] | undefined | null, customValue: string, otherValue: string): string[] => {
        const baseOptions = (options || []).filter(o => o !== otherValue);
        if ((options || []).includes(otherValue) && customValue.trim()) {
            return [...baseOptions, customValue.trim()];
        }
        return baseOptions;
    };
    const finalSetup = combineOptions(formData.setup, customSetup, "Other");
    const finalEmotion = combineOptions(formData.emotion, customEmotion, "Other");
    const finalMistakes = combineOptions(formData.mistakes, customMistake, "Other");

    const dataToSave: UpsertTokenSummary = {
        userId: userId,
        contractAddress: contractAddress,
        notes: formData.notes,
        setup: finalSetup,
        emotion: finalEmotion,
        mistakes: finalMistakes,
    };
    upsertSummaryMutation.mutate(dataToSave);
  };

  return (
    <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto p-6">
      <DialogHeader>
        <DialogTitle>Edit Summary: {tokenName || contractAddress.substring(0, 6)}</DialogTitle>
        <DialogDescription>Add or update journaling details for this token.</DialogDescription>
      </DialogHeader>
      {isLoadingSummary ? (
           <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-16">
                  {/* Setup Field */}
                  <FormField 
                    control={form.control} 
                    name="setup" 
                    render={({ field }) => ( 
                      <FormItem>
                        <FormLabel>Setup</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {setupOptions.map((option) => (
                            <FormItem key={option} className="flex items-center space-x-3">
                              <Checkbox 
                                checked={field.value?.includes(option)}
                                onCheckedChange={(checked) => {
                                  const currentValues = field.value || [];
                                  const newValue = checked 
                                    ? [...currentValues, option] 
                                    : currentValues.filter((v) => v !== option);
                                  field.onChange(newValue);
                                }}
                              />
                              <FormLabel className="font-normal">{option}</FormLabel>
                            </FormItem>
                          ))}
                        </div>
                        {field.value?.includes("Other") && (<Input placeholder="Describe setup..." value={customSetup} onChange={(e) => setCustomSetup(e.target.value)} className="mt-2"/>)}
                      </FormItem> 
                  )}/>
                  {/* Emotion Field */}
                  <FormField 
                    control={form.control} 
                    name="emotion" 
                    render={({ field }) => ( 
                      <FormItem>
                        <FormLabel>Emotion</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {emotionOptions.map((option) => (
                            <FormItem key={option} className="flex items-center space-x-3">
                              <Checkbox 
                                checked={field.value?.includes(option)}
                                onCheckedChange={(checked) => {
                                  const currentValues = field.value || [];
                                  const newValue = checked 
                                    ? [...currentValues, option] 
                                    : currentValues.filter((v) => v !== option);
                                  field.onChange(newValue);
                                }}
                              />
                              <FormLabel className="font-normal">{option}</FormLabel>
                            </FormItem>
                          ))}
                        </div>
                        {field.value?.includes("Other") && (<Input placeholder="Describe emotion..." value={customEmotion} onChange={(e) => setCustomEmotion(e.target.value)} className="mt-2"/>)}
                      </FormItem> 
                  )}/>
                  {/* Mistakes Field */}
                  <FormField 
                    control={form.control} 
                    name="mistakes" 
                    render={({ field }) => ( 
                      <FormItem>
                        <FormLabel>Mistakes</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {mistakeOptions.map((option) => (
                            <FormItem key={option} className="flex items-center space-x-3">
                              <Checkbox 
                                checked={field.value?.includes(option)}
                                onCheckedChange={(checked) => {
                                  const currentValues = field.value || [];
                                  const newValue = checked 
                                    ? [...currentValues, option] 
                                    : currentValues.filter((v) => v !== option);
                                  field.onChange(newValue);
                                }}
                              />
                              <FormLabel className="font-normal">{option}</FormLabel>
                            </FormItem>
                          ))}
                        </div>
                        {field.value?.includes("Other") && (<Input placeholder="Describe mistake..." value={customMistake} onChange={(e) => setCustomMistake(e.target.value)} className="mt-2"/>)}
                      </FormItem> 
                  )}/>
                  {/* Notes Field */} 
                  <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} value={field.value || ""} placeholder="Add summary notes..." /></FormControl><FormMessage /></FormItem> )}/>
                  
                  {/* Footer with Submit Button */}
                  <DialogFooter className="sticky bottom-[-24px] bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg border-t p-4 -mx-6">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={upsertSummaryMutation.isPending}> 
                        {upsertSummaryMutation.isPending && (<Loader2 className="mr-2 h-4 w-4 animate-spin" />)}
                        Save Summary Notes
                    </Button>
                  </DialogFooter>
              </form>
          </Form>
      )}
    </DialogContent>
  );
} 