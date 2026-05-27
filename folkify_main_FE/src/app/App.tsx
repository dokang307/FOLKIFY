import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { SubscriptionProvider } from "./subscription";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <SubscriptionProvider>
        <RouterProvider router={router} />
        {/* Toast notifications - Requirements: 9.6, 9.7, 9.8 */}
        <Toaster
          position="top-right"
          duration={3000}
          closeButton
          richColors
          toastOptions={{
            style: {
              background: "white",
              color: "#1f2937",
              border: "1px solid #e5e7eb",
            },
          }}
        />
      </SubscriptionProvider>
    </ErrorBoundary>
  );
}
