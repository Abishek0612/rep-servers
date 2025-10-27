import axiosInstance from "./axiosConfig";

const userService = {
  getCurrentUser: async () => {
    const response = await axiosInstance.get("/users/me");
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await axiosInstance.put("/users/me", profileData);
    return response.data;
  },
};

export default userService;
