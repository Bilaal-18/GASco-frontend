import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl"
        >
          <h1 className="text-5xl font-bold text-slate-800 mb-6">
            Welcome to <span className="text-blue-700">Gasco Portal</span>
          </h1>
          <p className="text-slate-600 mb-10 text-lg">
            Manage gas distribution, agents, and customers efficiently with our secure
            and modern system.
          </p>

          <div className="flex justify-center gap-4">
            <Link to="/register">
              <Button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-xl">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="rounded-xl px-6 py-2">
                Login
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            <Card className="p-4 shadow-sm hover:shadow-md transition-all duration-300 border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800">For Agents</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">
                Manage deliveries, register customers, and track your performance directly
                from your portal.
              </CardContent>
            </Card>

            <Card className="p-4 shadow-sm hover:shadow-md transition-all duration-300 border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800">For Admins</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">
                Oversee all operations, manage agents, and ensure smooth gas supply and
                customer satisfaction.
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>

      <footer className="bg-white text-center py-4 border-t border-slate-200 text-slate-500 text-sm">
        © {new Date().getFullYear()} Gasco Agencies — All rights reserved.
      </footer>
    </div>
  );
}
