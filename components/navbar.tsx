"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/players", label: "Players" },
    { href: "/history", label: "Match History" },
    { href: "/payment", label: "Payment" },
  ];

  return (
    <nav className="bg-gray-800 text-white px-22 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">SHUTTRACK BADMINTON</h1>
      </div>

      <div className="flex justify-between p-2 gap-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`hover:text-blue-300 transition ${
              pathname === link.href ? "text-blue-400 font-semibold" : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
