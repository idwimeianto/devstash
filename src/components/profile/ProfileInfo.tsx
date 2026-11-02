import { CalendarDays, Mail } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user/UserAvatar";
import type { UserProfile } from "@/types/profile";

const JOINED_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

interface ProfileInfoProps {
  profile: UserProfile;
}

export function ProfileInfo({ profile }: ProfileInfoProps) {
  const { name, email, image, createdAt } = profile;

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        {/* Initials fall back to the email when the account has no name. */}
        <UserAvatar name={name ?? email} image={image} className="size-16 text-lg" />
        <div className="grid min-w-0 gap-1">
          <h2 className="truncate text-xl font-semibold">{name ?? email}</h2>
          <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
            <Mail className="size-4 shrink-0" />
            <span className="truncate">{email}</span>
          </p>
          <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
            <CalendarDays className="size-4 shrink-0" />
            Joined {JOINED_FORMAT.format(createdAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
