import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./components/Home";
import { Learn } from "./components/Learn";
import { InstrumentDetail } from "./components/InstrumentDetail";
import { LessonDetail } from "./components/LessonDetail";
import { SheetMusic } from "./components/SheetMusic";
import { Practice } from "./components/Practice";
import { Profile } from "./components/Profile";
import { PremiumPlans } from "./components/PremiumPlans";
import { Login } from "./components/Login";
import { ForgotPassword } from "./components/ForgotPassword";
import { Register } from "./components/Register";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute";

export const router = createBrowserRouter([
  {
    Component: PublicOnlyRoute,
    children: [
      { path: "/login", Component: Login },
      { path: "/forgot-password", Component: ForgotPassword },
      { path: "/register", Component: Register },
    ],
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: Root,
        children: [
          { index: true, Component: Home },
          { path: "learn", Component: Learn },
          { path: "learn/:id", Component: InstrumentDetail },
          { path: "learn/:id/lesson/:lessonId", Component: LessonDetail },
          { path: "sheets", Component: SheetMusic },
          { path: "premium", Component: PremiumPlans },
          { path: "practice", Component: Practice },
          { path: "profile", Component: Profile },
        ],
      },
    ],
  },
]);
