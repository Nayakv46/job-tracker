"use client";

import { LogOut } from "lucide-react";
import PopoverWrapper from "@/components/ui/shadcn/PopoverWrapper";
import { Switch } from "@/components/ui/shadcn/switch";
import { useTheme } from "@/components/ui/shadcn/theme-provider";
import { signOut } from "@/lib/auth/client";

const itemClassName =
  "flex w-full items-center justify-between gap-4 px-3 py-2 text-sm text-foreground transition hover:bg-accent";

const UserMenu = ({ email }: { email: string | null }) => {
  const { theme, setTheme } = useTheme();
  const initial = email?.charAt(0).toUpperCase() ?? "?";

  return (
    <PopoverWrapper
      trigger={
        <button
          type="button"
          aria-label="Account menu"
          className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          {initial}
        </button>
      }
      description={
        <div className="flex flex-col">
          {email && (
            <p className="truncate border-b px-3 py-2 text-sm text-muted-foreground">
              {email}
            </p>
          )}
          <label className={itemClassName}>
            Dark mode
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
          </label>
          <button type="button" className={itemClassName} onClick={signOut}>
            Sign out
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      }
      className="w-56 overflow-hidden p-0"
    />
  );
};

export default UserMenu;
