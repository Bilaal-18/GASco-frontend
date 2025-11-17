import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Moon } from "lucide-react";

export default function Navbar() {
  return (

    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <motion.h1
        className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-slate-700 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        GASCO AGENCIES
      </motion.h1>

      <div className="flex gap-3">
        <Link to="/register">
          <Button variant="outline" className="rounded-xl">
            Register
          </Button>
        </Link>
        <Link to="/login">
          <Button className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white">
            Login
          </Button>
        </Link>

        <Button variant="outline" size="icon" className="rounded-full">
          <Moon size={18} />
        </Button>
      </div>
    </nav>
  );
}
