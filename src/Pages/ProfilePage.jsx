import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const ProfilePage = () => {
  const { currentUser, updateProfile, loading } = useAuth();
  const [firstName, setFirstName] = useState(currentUser?.firstName || "");
  const [lastName, setLastName] = useState(currentUser?.lastName || "");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name cannot be empty");
      return;
    }

    try {
      await updateProfile({ firstName, lastName });
      setSuccessMessage("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
        </div>

        <div className="p-6">
          {successMessage && (
            <div className="mb-4 bg-green-50 text-green-700 p-3 rounded">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFirstName(currentUser.firstName);
                      setLastName(currentUser.lastName);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <span className="text-gray-500 font-medium">
                      First Name
                    </span>
                    <p className="text-gray-900">{currentUser.firstName}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <span className="text-gray-500 font-medium">Last Name</span>
                    <p className="text-gray-900">{currentUser.lastName}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </div>

                <div className="py-3 border-b">
                  <span className="text-gray-500 font-medium">Email</span>
                  <p className="text-gray-900">{currentUser.email}</p>
                </div>

                <div className="py-3 border-b">
                  <span className="text-gray-500 font-medium">Role</span>
                  <p className="text-gray-900">{currentUser.role}</p>
                </div>

                <div className="py-3">
                  <span className="text-gray-500 font-medium">
                    Organization
                  </span>
                  <p className="text-green-600 font-medium">
                    {currentUser.organization ? "Connected" : "None"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
