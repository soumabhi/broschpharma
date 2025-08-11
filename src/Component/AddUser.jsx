import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const PERMISSIONS = [
  "BillingEntity",
  "BillingEntityMed",
  "company",
  "medCompany",
  "medicineProduct",
  "IolProduct",
  "medicineInventory",
  "IolInventory",
  "medInvoice",
  "IolInvoice",
  "userAdd",
  "IolProductAction",
];
const ROLES = ["superAdmin", "user"];

const AddUser = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [confirmActivate, setConfirmActivate] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editing, setEditing] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [form, setForm] = useState({
    userId: "",
    role: "user",
    permission: [],
    password: "",
    isActive: true,
  });

  // Fetch Users
  const getUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/user/`);
      const data = await response.json();
      setUsers(data?.users || []);
      setError("");
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserData();
  }, []);

  // Create User
  const createUser = async () => {
    try {
      setLoading(true);
      setError("");

      if (!form.userId || !form.password) {
        setError("User ID and Password are required");
        return;
      }

      const response = await fetch(`${apiUrl}/user/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      await getUserData();
      setIsModalOpen(false);
      resetForm();
      toast.success("User created successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      toast.error("Failed to create user");
      setError("Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  // Update User
  const updateUser = async () => {
    try {
      setLoading(true);
      setError("");

      if (!form.userId) {
        setError("User ID is required");
        return;
      }

      const updateData = {
        role: form.role,
        permission: form.permission,
      };

      const response = await axios.patch(
        `${apiUrl}/user/${editingUser?._id}`,
        updateData
      );

      if (response.status !== 200) {
        throw new Error("Failed to update user");
      }

      await getUserData();
      setIsModalOpen(false);
      resetForm();
      setEditingUser(null);
      setEditing(false);
      toast.success("User updated successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to update user");
      toast.error(err.response?.data?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  // Deactivate User
  const deactivateUser = async (userId) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${apiUrl}/user/deactivate/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to deactivate user");
      }

      await getUserData();
      setConfirmDeactivate(null);
      toast.success("User deactivated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to deactivate user");
      toast.error("Failed to deactivate user");
    } finally {
      setLoading(false);
    }
  };

  // Activate User
  const activateUser = async (userId) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${apiUrl}/user/activate/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to activate user");
      }

      await getUserData();
      toast.success("User activated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      toast.error("Failed to activate user");
      setError("Failed to activate user");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      userId: "",
      role: "user",
      permission: [],
      password: "",
      isActive: true,
    });
    setError("");
    setEditingPassword(false);
    setIsChangingPassword(false);
    setEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "role") {
      // If role is superAdmin, set all permissions
      setForm((prev) => ({
        ...prev,
        role: value,
        permission: value === "superAdmin" ? [...PERMISSIONS] : [],
      }));
    } else if (type === "checkbox" && name === "permission") {
      setForm((prev) => ({
        ...prev,
        permission: checked
          ? [...prev.permission, value]
          : prev.permission.filter((perm) => perm !== value),
      }));
    } else if (type === "checkbox" && name === "isActive") {
      setForm((prev) => ({ ...prev, isActive: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      userId: user.userId,
      role: user.role,
      permission: user.permission || [],
      password: "",
      isActive: user.isActive,
    });
    setIsModalOpen(true);
  };

  const updatePassword = async () => {
    try {
      setLoading(true);
      setError("");

      if (!form.password) {
        toast.warning("Password is required");
        return;
      }

      const response = await axios.patch(
        `${apiUrl}/user/updatePassword/${editingUser._id}`,
        {
          password: form.password,
        }
      );

      if (response.status !== 200) {
        throw new Error("Failed to update password");
      }

      toast.success("Password updated successfully!");
      setIsModalOpen(false);
      setEditingUser(null);
      resetForm();
      setIsChangingPassword(false);
      setEditingPassword(false);
      await getUserData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingPassword) {
      updatePassword();
    } else if (editingUser && !editingPassword) {
      updateUser();
    } else {
      createUser();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
    setEditingUser(null);
    setEditingPassword(false);
    setEditing(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={openAddModal}
        >
          Add User
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* User Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Permissions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id || user.userId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.userId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === "superAdmin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex gap-1 flex-wrap">
                    {(user.permission || []).map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditing(true);
                      openEditModal(user);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setEditingPassword(true);
                      openEditModal(user);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit password
                  </button>

                  {user.isActive ? (
                    <button
                      onClick={() => setConfirmDeactivate(user)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmActivate(user)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingPassword 
                ? "Change Password" 
                : editingUser 
                ? "Edit User" 
                : "Add New User"}
            </h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  name="userId"
                  value={form.userId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter user ID"
                  disabled={editingUser}
                />
              </div>

              {/* Password field - show for new users or when editing password */}
              {(!editingUser || editingPassword) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    placeholder="Enter password"
                    autoComplete="new-password"
                  />
                </div>
              )}

              {/* Role and Permissions - show for new users or when editing user (not password) */}
              {(!editingUser || (editingUser && !editingPassword)) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      value={form.role || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissions
                    </label>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-48 overflow-y-auto pr-1">
                      {PERMISSIONS.map((perm) => (
                        <label key={perm} className="flex items-center">
                          <input
                            type="checkbox"
                            name="permission"
                            value={perm}
                            checked={form.permission.includes(perm)}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          {perm}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Loading..." : 
                 editingPassword ? "Update Password" :
                 editingUser ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deactivate Modal */}
      {confirmDeactivate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Deactivation
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to deactivate user{" "}
              {confirmDeactivate.userId}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                onClick={() => setConfirmDeactivate(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                onClick={() => deactivateUser(confirmDeactivate._id)}
                disabled={loading}
              >
                {loading ? "Loading..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Activate Modal */}
      {confirmActivate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Activation
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to activate user{" "}
              <span className="font-bold text-blue-600">
                {confirmActivate.userId}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                onClick={() => setConfirmActivate(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                onClick={() => {
                  activateUser(confirmActivate._id);
                  setConfirmActivate(null);
                }}
                disabled={loading}
              >
                {loading ? "Loading..." : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUser;