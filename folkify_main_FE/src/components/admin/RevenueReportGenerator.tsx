/**
 * RevenueReportGenerator Component
 *
 * Generates revenue reports for specific date ranges.
 * Displays report in table format with date, amount, transaction count, and plan type.
 * Includes date range validation and summary totals.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7
 */

import { useState } from "react";
import { adminAnalyticsService } from "../../services/adminAnalyticsService";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import { formatCurrency, formatDate, formatNumber } from "../../utils/format";
import { LoadingSpinner } from "./LoadingSpinner";
import type { RevenueReportData } from "../../types/admin";

export function RevenueReportGenerator() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<RevenueReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Validate date range
   */
  const validateDateRange = (): boolean => {
    setValidationError(null);

    if (!startDate || !endDate) {
      setValidationError("Vui lòng chọn ngày bắt đầu và ngày kết thúc");
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setValidationError("Ngày bắt đầu phải trước ngày kết thúc");
      return false;
    }

    return true;
  };

  /**
   * Generate revenue report
   */
  const handleGenerateReport = async () => {
    if (!validateDateRange()) {
      return;
    }

    setLoading(true);
    try {
      const response = await adminAnalyticsService.getRevenueReport({
        startDate,
        endDate,
      });

      setReportData(response.data);
      showSuccessToast("Tạo báo cáo thành công");
    } catch (error) {
      console.error("Error generating revenue report:", error);
      showErrorToast("Không thể tạo báo cáo. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export report to CSV
   */
  const handleExportCSV = () => {
    if (!reportData) return;

    // Create CSV content
    const headers = ["Ngày", "Số tiền", "Số giao dịch", "Loại gói"];
    const rows = reportData.transactions.map((transaction) => [
      formatDate(transaction.date),
      transaction.amount.toString(),
      "1", // Each transaction is 1 count
      transaction.planType === "basic" ? "Cơ bản" : "Chuyên nghiệp",
    ]);

    // Add summary row
    rows.push([
      "Tổng cộng",
      reportData.summary.totalRevenue.toString(),
      reportData.summary.totalTransactions.toString(),
      "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `revenue-report-${startDate}-to-${endDate}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccessToast("Xuất báo cáo CSV thành công");
  };

  return (
    <article className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Báo cáo doanh thu
      </h2>

      {/* Date Range Picker */}
      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerateReport();
        }}
      >
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Ngày bắt đầu
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            aria-label="Select start date for revenue report"
          />
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Ngày kết thúc
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            aria-label="Select end date for revenue report"
          />
        </div>
      </form>

      {/* Validation Error */}
      {validationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{validationError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleGenerateReport}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleGenerateReport();
            }
          }}
          disabled={loading}
          className={`
            px-4 py-2 
            rounded-md 
            font-medium 
            text-white 
            transition-colors
            focus:outline-none
            focus:ring-2
            focus:ring-offset-2
            focus:ring-[#2D6A4F]
            ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#2D6A4F] hover:bg-[#1B4332]"
            }
          `}
          aria-label="Generate revenue report"
          tabIndex={0}
        >
          {loading ? "Đang tạo..." : "Tạo báo cáo"}
        </button>

        {reportData && (
          <button
            onClick={handleExportCSV}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleExportCSV();
              }
            }}
            className="px-4 py-2 rounded-md font-medium text-[#2D6A4F] border border-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D6A4F]"
            aria-label="Export revenue report to CSV"
            tabIndex={0}
          >
            Xuất CSV
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-8">
          <LoadingSpinner size="medium" text="Đang tạo báo cáo..." />
        </div>
      )}

      {/* Report Table */}
      {!loading && reportData && (
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="Revenue report table"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ngày
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Số tiền
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email người dùng
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Loại gói
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.transactions.map((transaction, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.userEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.planType === "basic"
                      ? "Cơ bản"
                      : "Chuyên nghiệp"}
                  </td>
                </tr>
              ))}

              {/* Summary Row */}
              <tr className="bg-gray-100 font-bold">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Tổng cộng
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(reportData.summary.totalRevenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(reportData.summary.totalTransactions)} giao dịch
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Trung bình:{" "}
                  {formatCurrency(reportData.summary.averageTransactionValue)}
                </td>
              </tr>
            </tbody>
          </table>

          {reportData.transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không có giao dịch nào trong khoảng thời gian này
            </div>
          )}
        </div>
      )}
    </article>
  );
}
