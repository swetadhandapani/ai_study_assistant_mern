import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { toast } from "react-toastify";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

  // ✅ Define backend base URLs
  const API_BASE = import.meta.env.VITE_API_URL;
  const UPLOAD_BASE = API_BASE.replace("/api", "");

  // 2FA states
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [totpCode, setTotpCode] = useState("");
  const [showVerifyStep, setShowVerifyStep] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    avatar: null,
    avatarName: "",
  });

  // ---------- Normalize avatar ----------
  const normalizeAvatar = (userObj) => {
    if (!userObj) return null;
    let avatar = userObj.avatar;
    if (avatar && !avatar.startsWith("http")) {
      avatar = `${UPLOAD_BASE}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
    }
    return { ...userObj, avatar };
  };

  // ---------- Load Profile ----------
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
      const parsed = normalizeAvatar(JSON.parse(storedUser));
      setUser(parsed);
      setFormData({
        name: parsed.name,
        role: parsed.role || "User",
        avatar: parsed.avatar || null,
        avatarName: parsed.avatar ? parsed.avatar.split("/").pop() : "",
      });
    } else {
      navigate("/");
    }
  }, [navigate]);

  // ---------- Profile Update ----------
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("role", formData.role);
      if (formData.avatar && typeof formData.avatar !== "string") {
        data.append("avatar", formData.avatar);
      }

      const token = localStorage.getItem("token");
      const res = await api.put("/auth/profile", data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUser = normalizeAvatar(res.data.user);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event("userUpdated"));
      toast.success("Profile updated!");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  // ---------- Avatar Removal ----------
  const handleRemoveAvatar = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(
        "/auth/profile",
        { name: formData.name, role: formData.role, avatar: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = normalizeAvatar(res.data.user);
      updatedUser.avatar = null;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setFormData({ ...formData, avatar: null, avatarName: "" });
      window.dispatchEvent(new Event("storage"));
      toast.success("Profile picture removed!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Remove failed");
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-8 text-center text-white">
          <h1 className="text-3xl font-bold">👤 Profile</h1>
          <p className="text-sm opacity-90">Manage your account details</p>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-center">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center text-4xl text-white font-bold shadow-md">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Name:</span>
              <span className="font-medium">{user.name || "Not provided"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Email:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Role:</span>
              <span className="font-medium">{user.role || "User"}</span>
            </div>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-5 py-2 rounded-md shadow-md transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-md shadow"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-3 border rounded-lg"
                placeholder="Full Name"
              />
              <input
                type="text"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full p-3 border rounded-lg"
                placeholder="Role"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    avatar: e.target.files[0],
                    avatarName: e.target.files[0]?.name || "",
                  })
                }
                className="w-full"
              />
              {formData.avatar && (
                <img
                  src={
                    typeof formData.avatar === "string"
                      ? formData.avatar
                      : URL.createObjectURL(formData.avatar)
                  }
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover mx-auto mt-2"
                />
              )}

              {user.avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-md"
                >
                  Remove Profile Picture
                </button>
              )}

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
