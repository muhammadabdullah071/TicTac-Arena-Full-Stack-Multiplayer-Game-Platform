"use client";

import { useEffect } from "react";
import useAuth from "@/utils/useAuth";
import { useNavigate } from "react-router-dom";

export default function LogoutPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      await signOut({ callbackUrl: "/", redirect: false });
      navigate("/");
    };
    performLogout();
  }, [signOut, navigate]);

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#6D28D9] border-t-transparent mb-4"></div>
        <p className="text-white text-lg">Signing out...</p>
      </div>
    </div>
  );
}
