import api from "./api";

export const authService = {
  async login({ email, password }) {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { user, accessToken } = response.data.data;

    // Keep access token available for authenticated API requests
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(user));

    return user;
  },

  async register({ fullName, email, phone, password }) {
    if (!fullName || !email || !phone || !password) {
      throw new Error("All fields are required.");
    }

    const nameParts = fullName.trim().split(/\s+/);

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    const response = await api.post("/auth/register", {
      firstName,
      lastName,
      email,
      phone,
      password,
    });

    return response.data.data;
  },

  async forgotPassword(email) {
    if (!email) {
      throw new Error("Email is required.");
    }

    const response = await api.post("/auth/forgot-password", {
      email,
    });

    return response.data;
  },

  async getMe() {
    const response = await api.get("/auth/me");
    const user = response.data.data;

    localStorage.setItem("user", JSON.stringify(user));

    return user;
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    }
  },
};