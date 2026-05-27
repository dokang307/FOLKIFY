/**
 * LessonList Demo Component
 *
 * Demonstrates the LessonList component with sample data.
 * This is for development/testing purposes only.
 */

import { BrowserRouter } from "react-router";
import { LessonList } from "./LessonList";
import { Toaster } from "sonner";

export function LessonListDemo() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Lesson Management UI Demo
            </h1>
            <p className="text-gray-600">
              This demo showcases the LessonList component with all features:
              pagination, filtering, sorting, publish/unpublish, and delete.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <LessonList />
          </div>
        </div>

        {/* Toast notifications */}
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}
