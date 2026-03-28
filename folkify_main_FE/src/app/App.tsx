import { RouterProvider } from "react-router";
import { router } from "./routes";
import { SubscriptionProvider } from "./subscription";

export default function App() {
  return (
    <SubscriptionProvider>
      <RouterProvider router={router} />
    </SubscriptionProvider>
  );
}
