import { signInWithGitHub } from "@/actions/auth";
import { GitHubIcon } from "@/components/auth/GitHubIcon";
import { Button } from "@/components/ui/button";

interface GitHubAuthButtonProps {
  label: string;
  callbackUrl?: string;
}

// The same GitHub round trip signs in or creates the account, followed by an "or" divider.
export function GitHubAuthButton({ label, callbackUrl = "" }: GitHubAuthButtonProps) {
  return (
    <>
      <form action={signInWithGitHub}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Button type="submit" variant="outline" className="w-full">
          <GitHubIcon />
          {label}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}
