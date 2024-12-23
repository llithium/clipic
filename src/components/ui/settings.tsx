import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  // FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  // FormMessage,
} from "@/components/ui/form";
import { useTheme } from "../providers/theme-provider";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { MoveLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Theme } from "@tauri-apps/api/window";
import { useSettingsStore } from "@/hooks/useSettingsStore";

const formSchema = z.object({
  theme: z.string(),
  windowMovement: z.string(),
});

function Settings() {
  const { theme, setTheme } = useTheme();
  const { toggleSettings } = usePlayerStore();
  const { windowMovement, updateWindowMovement } = useSettingsStore();
  console.log(windowMovement);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      theme: theme,
      windowMovement: windowMovement,
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setTheme(values.theme as Theme);
    updateWindowMovement(values.windowMovement);
  }

  return (
    <div className="pt-8 pb-2 px-4 absolute z-30 h-screen w-screen font-extrabold text-3xl">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-6"
        >
          <section className="w-1/2 flex flex-col pt-4">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* <FormDescription>
                </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="windowMovement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Window Movement</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method for moving the window" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="titleBar">Title bar only</SelectItem>
                      <SelectItem value="anywhere">
                        {
                          "Click and drag anywhere (double-click for play/pause)"
                        }
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {/* <FormDescription>
                </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>
          {/* <section className="w-1/2 flex flex-col pt-4"></section> */}

          <div className="flex w-full justify-between">
            <Button variant={"ghost"} onClick={toggleSettings}>
              <MoveLeft />
            </Button>
            <Button type="submit">Save</Button>{" "}
          </div>
        </form>
      </Form>
    </div>
  );
}

export default Settings;
