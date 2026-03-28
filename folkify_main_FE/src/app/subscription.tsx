import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";

export type PlanTier = "free" | "basic" | "pro";

const STORAGE_KEY = "folkify_plan_tier";

type SubscriptionContextValue = {
  plan: PlanTier;
  isPremium: boolean;
  setPlan: (plan: PlanTier) => void;
  upgradeToPremium: () => void;
  downgradeToFree: () => void;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function getInitialPlan(): PlanTier {
  if (typeof window === "undefined") return "free";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "basic") return "basic";
  if (saved === "pro" || saved === "premium") return "pro";
  return "free";
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<PlanTier>(getInitialPlan);

  const setPlan = (nextPlan: PlanTier) => {
    setPlanState(nextPlan);
    window.localStorage.setItem(STORAGE_KEY, nextPlan);
  };

  const value = useMemo(
    () => ({
      plan,
      isPremium: plan !== "free",
      setPlan,
      upgradeToPremium: () => setPlan("pro"),
      downgradeToFree: () => setPlan("free"),
    }),
    [plan],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
}

export function useRequirePremium() {
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  return (feature?: string) => {
    if (isPremium) return true;

    navigate("/premium", {
      state: {
        from: `${location.pathname}${location.search}${location.hash}`,
        feature,
      },
    });
    return false;
  };
}
