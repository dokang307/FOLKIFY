/**
 * DashboardHome Usage Example
 *
 * This file demonstrates how to integrate the DashboardHome component
 * into the admin dashboard routing structure.
 *
 * NOTE: This is an example file for reference only.
 * The actual integration should be done in your routing configuration.
 */

import { DashboardHome } from "./DashboardHome";
import { AdminLayout } from "./AdminLayout";

/**
 * Example: Using DashboardHome as the main admin dashboard page
 */
export function AdminDashboardPage() {
  return (
    <AdminLayout>
      <DashboardHome />
    </AdminLayout>
  );
}

/**
 * Example: React Router configuration
 *
 * import { Routes, Route } from 'react-router';
 * import { ProtectedAdminRoute } from './components/admin/ProtectedAdminRoute';
 * import { DashboardHome } from './components/admin/DashboardHome';
 *
 * function AdminRoutes() {
 *   return (
 *     <Routes>
 *       <Route
 *         path="/admin"
 *         element={
 *           <ProtectedAdminRoute>
 *             <AdminLayout>
 *               <DashboardHome />
 *             </AdminLayout>
 *           </ProtectedAdminRoute>
 *         }
 *       />
 *       {/* Other admin routes... *\/}
 *     </Routes>
 *   );
 * }
 */

/**
 * Example: Standalone usage (without layout)
 *
 * If you want to use DashboardHome without the AdminLayout wrapper:
 *
 * import { DashboardHome } from './components/admin/DashboardHome';
 *
 * function MyCustomAdminPage() {
 *   return (
 *     <div className="custom-container">
 *       <DashboardHome />
 *     </div>
 *   );
 * }
 */

/**
 * Key Features:
 *
 * 1. Auto-refresh: Statistics automatically refresh every 60 seconds
 * 2. Manual refresh: Click the "Làm mới" button to refresh immediately
 * 3. Caching: Data is cached for 60 seconds to reduce API calls
 * 4. Loading states: Shows spinner during initial load and refresh
 * 5. Error handling: Displays toast notifications on errors
 * 6. Last refresh timestamp: Shows when data was last updated
 * 7. Responsive: Works on all screen sizes (768px to 1920px)
 * 8. Vietnamese labels: All text is in Vietnamese
 * 9. Color coding: Green (positive), Red (negative), Yellow (warning), Blue (info)
 */

/**
 * API Dependencies:
 *
 * The DashboardHome component requires these backend endpoints:
 * - GET /api/admin/analytics/users
 * - GET /api/admin/analytics/revenue
 * - GET /api/admin/analytics/ai-grading
 *
 * Make sure these endpoints are available and return data in the expected format.
 */

/**
 * Styling:
 *
 * The component uses Tailwind CSS classes and follows the design system:
 * - Primary color: #2D6A4F (green)
 * - Hover color: #1B4332 (darker green)
 * - Text colors: gray-900, gray-600
 * - Background: white cards with shadow-md
 * - Border: gray-200
 */
