export type RedirectContext = {
  path: string;
  label: string;
  title: string;
  subtitle: string;
  cta: string;
  perks: string[];
};

export function getRedirectContext(path?: string): RedirectContext | null {
  if (!path) return null;

  if (path === "/leaderboard" || path.startsWith("/leaderboard/")) {
    return {
      path: "/leaderboard",
      label: "Leaderboard",
      title: "See where you rank nationally",
      subtitle:
        "The weekly leaderboard tracks verified reading time and XP across Ethiopian universities. Sign in to view rankings and your position.",
      cta: "Sign in to view Leaderboard",
      perks: [
        "Live national rankings updated every 5 minutes",
        "Compare XP with students at your university",
        "Track weekly movement and study streaks",
      ],
    };
  }

  if (path === "/rewards" || path.startsWith("/rewards/")) {
    return {
      path: "/rewards",
      label: "Rewards",
      title: "Unlock your XP wallet",
      subtitle:
        "Redeem XP for airtime, badges, bank withdrawals, and more. Your account keeps rewards safe and lets admins verify payouts.",
      cta: "Sign in to open Rewards",
      perks: [
        "Redeem XP for real ETB via Ethiopian banks",
        "Refer classmates and earn bonus XP",
        "Withdraw to CBE, Awash, Dashen & 12 more banks",
      ],
    };
  }

  return null;
}
