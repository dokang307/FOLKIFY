/**
 * ActivityLogList Demo Component
 *
 * Demonstration page for the ActivityLogList component.
 * This can be used for testing and showcasing the activity logs UI.
 */

import { BrowserRouter } from "react-router";
import { ActivityLogList } from "./ActivityLogList";
import { Toaster } from "sonner";

export function ActivityLogListDemo() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Activity Logs Demo
            </h1>
            <p className="text-gray-600">
              Demonstration of the ActivityLogList component with all features:
              pagination, filtering, auto-refresh, and expandable details.
            </p>
          </div>

          <ActivityLogList />
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}
