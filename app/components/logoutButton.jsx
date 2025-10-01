"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 py-[5px] px-3 rounded-[3px] fixed top-5 right-4 z-50 text-white"
    >
      Logout
    </button>
  );
}
