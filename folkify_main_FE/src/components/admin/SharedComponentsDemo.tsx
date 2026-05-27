/**
 * Shared Components Demo
 *
 * This file demonstrates the usage of all shared UI components.
 * It can be used for testing and as a reference for developers.
 *
 * NOTE: This is a demo file and should not be included in production builds.
 */

import { useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { ConfirmDialog } from "./ConfirmDialog";
import { StatisticsCard } from "./StatisticsCard";
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
} from "../../utils/toast";

export function SharedComponentsDemo() {
  const [showDangerDialog, setShowDangerDialog] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = (type: string) => {
    showSuccessToast(`${type} action confirmed!`);
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showSuccessToast("Loading completed!");
    }, 2000);
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900">
        Shared Components Demo
      </h1>

      {/* LoadingSpinner Demo */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">LoadingSpinner Component</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Small Size
            </h3>
            <LoadingSpinner size="small" text="Loading small..." />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Medium Size (Default)
            </h3>
            <LoadingSpinner size="medium" text="Loading medium..." />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Large Size
            </h3>
            <LoadingSpinner size="large" text="Loading large..." />
          </div>
        </div>
      </section>

      {/* ConfirmDialog Demo */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">ConfirmDialog Component</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setShowDangerDialog(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Show Danger Dialog
          </button>
          <button
            onClick={() => setShowWarningDialog(true)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Show Warning Dialog
          </button>
          <button
            onClick={() => setShowInfoDialog(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Show Info Dialog
          </button>
        </div>

        <ConfirmDialog
          open={showDangerDialog}
          title="Delete Lesson"
          message="Are you sure you want to delete this lesson? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={() => {
            handleConfirm("Danger");
            setShowDangerDialog(false);
          }}
          onCancel={() => setShowDangerDialog(false)}
        />

        <ConfirmDialog
          open={showWarningDialog}
          title="Unpublish Lesson"
          message="This lesson will no longer be visible to users. You can republish it later."
          confirmText="Unpublish"
          cancelText="Cancel"
          variant="warning"
          onConfirm={() => {
            handleConfirm("Warning");
            setShowWarningDialog(false);
          }}
          onCancel={() => setShowWarningDialog(false)}
        />

        <ConfirmDialog
          open={showInfoDialog}
          title="Save Changes"
          message="Do you want to save your changes before leaving?"
          confirmText="Save"
          cancelText="Discard"
          variant="info"
          onConfirm={() => {
            handleConfirm("Info");
            setShowInfoDialog(false);
          }}
          onCancel={() => setShowInfoDialog(false)}
        />
      </section>

      {/* StatisticsCard Demo */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">StatisticsCard Component</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatisticsCard
            title="User Statistics"
            metrics={[
              { label: "Total Users", value: 1234, color: "blue" },
              { label: "Active Users", value: 890, color: "green" },
              { label: "Banned Users", value: 12, color: "red" },
              { label: "New This Month", value: 45, color: "green" },
            ]}
          />

          <StatisticsCard
            title="Revenue Statistics"
            metrics={[
              { label: "Total Revenue", value: "$12,345", color: "green" },
              { label: "Monthly Revenue", value: "$2,890", color: "green" },
              { label: "Active Subscriptions", value: 234, color: "blue" },
              { label: "Pending Payments", value: 5, color: "yellow" },
            ]}
          />

          <StatisticsCard
            title="AI Grading Statistics"
            loading={isLoading}
            metrics={[
              { label: "Total Sessions", value: 567, color: "blue" },
              { label: "Completed", value: 450, color: "green" },
              { label: "Pending", value: 100, color: "yellow" },
              { label: "Failed", value: 17, color: "red" },
            ]}
          />
        </div>
        <button
          onClick={simulateLoading}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={isLoading}
        >
          Simulate Loading
        </button>
      </section>

      {/* Toast Demo */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Toast Notifications</h2>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() =>
              showSuccessToast("Operation completed successfully!")
            }
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Show Success Toast
          </button>
          <button
            onClick={() =>
              showErrorToast("An error occurred. Please try again.")
            }
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Show Error Toast
          </button>
          <button
            onClick={() => showInfoToast("This is an informational message.")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Show Info Toast
          </button>
          <button
            onClick={() =>
              showWarningToast("Warning: This action requires attention.")
            }
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Show Warning Toast
          </button>
        </div>
      </section>
    </div>
  );
}
