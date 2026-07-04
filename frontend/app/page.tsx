"use client";

import { useState } from "react";
import { Lock, Mail, User } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter(); // <--- Added router for redirection

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        // Login Logic
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          email,
          password,
        });
        
        localStorage.setItem("token", response.data.access_token);
        setSuccess("Access Granted. Initializing Dashboard...");
        
        // Redirect to Dashboard after 1 second for a smooth transition
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);

      } else {
        // Registration Logic
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
          name,
          email,
          password,
        });
        setSuccess("Perimeter Secured! Account created. Please log in.");
        setIsLogin(true); // Automatically flips to login view
        setPassword(""); // Clears password for security
      }
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.detail || "Authentication failed.");
      } else {
        setError("Cannot connect to server. Ensure backend is running.");
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#121214] border border-white/10 rounded-2xl p-8 shadow-2xl">
        
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isLogin ? "System Access" : "Request Authorization"}
          </h1>
          <p className="text-sm text-gray-400">
            {isLogin 
              ? "Authenticate to access the threat detection engine." 
              : "Register to secure your digital perimeter."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Agent Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                required={!isLogin}
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="email" 
              placeholder="Secure Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="password" 
              placeholder="Passcode"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors mt-4"
          >
            {isLogin ? "Initialize Session" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccess("");
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isLogin 
              ? "New Agent? Register here." 
              : "Existing Agent? Log in here."}
          </button>
        </div>

      </div>
    </div>
  );
}