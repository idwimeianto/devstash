import { signOutUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Shown when the session outlives the account, e.g. after deleting it on another device.
export function MissingAccount() {
  return (
    <Card>
      <CardContent className="grid justify-items-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">This account no longer exists.</p>
        <form action={signOutUser}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
