import { useEffect, useState } from "react";
import { adminService, UserListItem } from "../../services/adminService";
import { AdminLayout } from "../../components/admin/AdminLayout";

export function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    accountType: "" as "" | "free" | "basic" | "pro",
    accountStatus: "" as "" | "active" | "banned" | "suspended",
    search: "",
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers({
        ...filters,
        accountType: filters.accountType || undefined,
        accountStatus: filters.accountStatus || undefined,
        search: filters.search || undefined,
        page: currentPage,
        limit: 20,
      });
      setUsers(response.users);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    const reason = prompt("Nhập lý do khóa tài khoản:");
    if (!reason) return;

    try {
      await adminService.banUser(userId, reason);
      alert("Đã khóa tài khoản thành công");
      loadUsers();
    } catch (error) {
      alert("Lỗi khi khóa tài khoản");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm("Bạn có chắc muốn mở khóa tài khoản này?")) return;

    try {
      await adminService.unbanUser(userId);
      alert("Đã mở khóa tài khoản thành công");
      loadUsers();
    } catch (error) {
      alert("Lỗi khi mở khóa tài khoản");
    }
  };

  const handleUpgradeUser = async (userId: string) => {
    const planType = prompt("Nhập loại gói (basic/pro):") as "basic" | "pro";
    if (!planType || !["basic", "pro"].includes(planType)) {
      alert("Loại gói không hợp lệ");
      return;
    }

    const months = prompt("Nhập số tháng (1-12):");
    if (!months) return;
    const durationMonths = parseInt(months);
    if (isNaN(durationMonths) || durationMonths < 1 || durationMonths > 12) {
      alert("Số tháng không hợp lệ");
      return;
    }

    try {
      await adminService.upgradeUser(userId, planType, durationMonths);
      alert("Đã nâng cấp tài khoản thành công");
      loadUsers();
    } catch (error) {
      alert("Lỗi khi nâng cấp tài khoản");
    }
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
        <p className="mt-1 text-sm text-gray-500">
          Xem và quản lý tài khoản người dùng
        </p>
      </div>

      {/* Filters */}
      <div>
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm email hoặc tên..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="px-4 py-2 border rounded-lg"
            />
            <select
              value={filters.accountType}
              onChange={(e) =>
                setFilters({ ...filters, accountType: e.target.value as any })
              }
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Tất cả loại tài khoản</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
            <select
              value={filters.accountStatus}
              onChange={(e) =>
                setFilters({ ...filters, accountStatus: e.target.value as any })
              }
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
              <option value="suspended">Suspended</option>
            </select>
            <button
              onClick={() =>
                setFilters({ accountType: "", accountStatus: "", search: "" })
              }
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Loại TK
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hết hạn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.account_type === "pro"
                              ? "bg-purple-100 text-purple-800"
                              : user.account_type === "basic"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.account_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.account_status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.account_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.premium_expires_at
                          ? new Date(
                              user.premium_expires_at,
                            ).toLocaleDateString("vi-VN")
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleUpgradeUser(user.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Nâng cấp
                        </button>
                        {user.account_status === "active" ? (
                          <button
                            onClick={() => handleBanUser(user.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Khóa
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnbanUser(user.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Mở khóa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
              >
                ← Trước
              </button>
              <span className="px-4 py-2 bg-white border rounded-lg">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
              >
                Sau →
              </button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
