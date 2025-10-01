"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

const WoningTovenaarLogo = ({
  className = "w-32 h-32", // bigger default size
}) => (
  <div className="flex justify-center">
    <div className={`${className} flex items-center justify-center`}>
      <img src="/logo.jpg" alt="WoningTovenaar Logo" className="w-full h-full object-contain" />
    </div>
  </div>
);

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      if (password === "admin123") {
        localStorage.setItem("isAuthenticated", "true");
        router.push("/conversations");
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          {/* Bigger centered logo */}
          <WoningTovenaarLogo className=" w-36 mx-auto" />
          <h1 className="text-3xl font-bold text-[#1e40af] mb-2">Welcome Back</h1>
          <p className="text-gray-600">Enter your password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a8a8] focus:border-[#00a8a8] text-gray-900"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-gradient-to-r from-[#00a8a8] to-[#1e40af] hover:from-[#008a8a] hover:to-[#1e40af]/90 text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 transition-all shadow-md"
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
