import type { ReactElement } from "react";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { showUpgradeToast } from "@/lib/upgrade-toast";
import { UPGRADE_HREF } from "@/lib/usage-limits";

vi.mock("sonner", () => ({ toast: { error: vi.fn(() => "toast_1"), dismiss: vi.fn() } }));

type UpgradeLinkProps = { href: string; onClick: () => void; children: string };

function shownToast() {
  const [message, options] = vi.mocked(toast.error).mock.calls[0];
  return { message, options, link: options?.action as ReactElement<UpgradeLinkProps> };
}

describe("showUpgradeToast", () => {
  it("shows a red error toast at the top center", () => {
    showUpgradeToast("The free plan includes 3 collections.");

    const { message, options } = shownToast();
    expect(message).toBe("The free plan includes 3 collections.");
    expect(options).toMatchObject({ position: "top-center" });
    expect(options?.classNames?.toast).toContain("bg-red-600");
  });

  it("links to the upgrade page and closes the toast when clicked", () => {
    showUpgradeToast("Upgrade needed");

    const { link } = shownToast();
    expect(UPGRADE_HREF).toBe("/upgrade");
    expect(link.props.href).toBe(UPGRADE_HREF);
    expect(link.props.children).toBe("Upgrade");

    link.props.onClick();
    expect(toast.dismiss).toHaveBeenCalledWith("toast_1");
  });
});
