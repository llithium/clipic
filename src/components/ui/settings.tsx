import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  // FormMessage,
} from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
import { Switch } from "./switch";
import { useTheme } from "../providers/theme-provider";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { MoveLeft } from "lucide-react";
const formSchema = z.object({
  // username: z.string().min(2).max(50),
  theme: z.boolean().default(true).optional(),
});

function Settings() {
  const { theme,setTheme } = useTheme();
  const { toggleSettings } = usePlayerStore();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // defaultValues: {
    //   username: "",
    // },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
    values.theme === true ? setTheme("dark") : setTheme("light");
  }

  return (
    <div className="pt-8 pb-2 px-4 absolute z-30 h-screen w-screen font-extrabold text-3xl">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-6"
        >
          <div className="grid grid-rows-2 pt-6 grid-cols-2 gap-4">
            {/* <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="shadcn" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
            <div>
              {/* <h3 className="mb-4 text-lg font-medium">Email Notifications</h3> */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Dark Mode</FormLabel>
                        <FormDescription>Select theme</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                        defaultChecked={theme === "dark" ? true : false}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

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
