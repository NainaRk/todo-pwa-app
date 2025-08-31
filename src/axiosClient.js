import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://localhost:7146/api",                // 🔹 replace with your backend URL
});

export default axiosClient;