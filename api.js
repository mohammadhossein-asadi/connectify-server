const API_BASE_URL = import.meta.env.VITE_API_URL;
const CLIENT_URL = import.meta.env.VITE_CLIENT_URL;

const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = 5000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Origin: CLIENT_URL,
  };

  const finalOptions = {
    ...fetchOptions,
    headers: {
      ...defaultHeaders,
      ...fetchOptions.headers,
    },
    mode: "cors",
    credentials: "include",
    signal: controller.signal,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, finalOptions);
    clearTimeout(id);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || response.statusText);
      error.response = response;
      throw error;
    }

    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    const response = await fetchWithTimeout("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    // Store token in localStorage
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Add this function for authenticated requests
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  return fetchWithTimeout(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
};
