import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "../components/Navbar";
import axios from "@/config/config";
import {
  Loader2,
  Users,
  UserCheck,
  Flame,
  ShieldCheck,
  Truck,
  CreditCard,
  ArrowRight,
  Star,
} from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const [stats, setStats] = useState({ agents: 0, customers: 0 });
  const [cylinders, setCylinders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animatedStats, setAnimatedStats] = useState({ agents: 0, customers: 0 });

  useEffect(() => {
    toast.info("Server may respond slowly", {
      description:
        "The server is currently running on a free tier hosting service, so initial requests may take longer to load.",
      action: { label: "OK", onClick: () => { } },
    });

    const fetchHomeData = async () => {
      try {
        const [statsRes, cylindersRes] = await Promise.all([
          axios.get("/api/public/stats").catch(() => ({ data: { agents: 0, customers: 0 } })),
          axios.get("/api/public/cylinders").catch(() => ({ data: { cylinders: [] } })),
        ]);
        setStats(statsRes.data || { agents: 0, customers: 0 });
        setCylinders(cylindersRes.data?.cylinders || []);
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Animated counter effect
  useEffect(() => {
    if (loading) return;
    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedStats({
        agents: Math.round(ease * stats.agents),
        customers: Math.round(ease * stats.customers),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [loading, stats]);

  const getCylinderTypeLabel = (type) =>
    type === "commercial" ? "Commercial" : "Private Commercial";

  const getCylinderNameLabel = (name) => name || "Gas Cylinder";

  const features = [
    {
      icon: <Truck className="w-6 h-6" />,
      title: "For Agents",
      description:
        "Manage deliveries, register customers, and track your performance with real-time insights.",
      color: "from-blue-500/10 to-blue-600/5",
      iconBg: "bg-blue-500/10 text-blue-600",
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "For Admins",
      description:
        "Full control over all operations — manage agents, monitor stock, and view analytics.",
      color: "from-violet-500/10 to-violet-600/5",
      iconBg: "bg-violet-500/10 text-violet-600",
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "For Customers",
      description:
        "Book cylinders online, track your order status, and make secure payments effortlessly.",
      color: "from-emerald-500/10 to-emerald-600/5",
      iconBg: "bg-emerald-500/10 text-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fc]">
      <Navbar />

      <main className="flex-1">
        {/* ─── HERO ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-28 px-6">
          {/* Decorative blobs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
            }}
          />

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-4 py-1.5 mb-6">
              <Flame className="w-3.5 h-3.5" />
              Trusted Gas Management Platform
            </span>

            <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight tracking-tight mb-5">
              Manage Gas Cylinders{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Smarter
              </span>
            </h1>

            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              GASco is a modern, end-to-end platform for agents, admins, and customers to
              manage gas cylinder deliveries, orders, and payments — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 h-12 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border border-white/20 text-white bg-white/5 hover:bg-white/10 font-semibold px-8 h-12 rounded-xl backdrop-blur transition-all duration-200 hover:-translate-y-0.5"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── STATS ────────────────────────────────────────────── */}
        <section className="py-14 px-6 bg-white border-b border-slate-100">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6 sm:gap-10">
                {/* Agents */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-1">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div className="text-4xl font-extrabold text-slate-900 tabular-nums">
                    {animatedStats.agents.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    Active Agents
                  </div>
                </div>

                {/* Customers */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mb-1">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-4xl font-extrabold text-slate-900 tabular-nums">
                    {animatedStats.customers.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    Happy Customers
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── FEATURES ─────────────────────────────────────────── */}
        <section className="py-20 px-6 bg-[#f8f9fc]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">
                Built for everyone
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
                Why Choose GASco?
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Whether you're delivering, overseeing, or ordering — GASco has the right
                tools for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div
                  key={i}
                  className={`group relative bg-gradient-to-br ${f.color} border border-slate-200 rounded-2xl p-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-slate-300`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${f.iconBg} mb-5`}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CYLINDERS ────────────────────────────────────────── */}
        {cylinders.length > 0 && (
          <section className="py-20 px-6 bg-white border-t border-slate-100">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">
                  Our Products
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
                  Available Cylinder Types
                </h2>
                <p className="text-slate-500 max-w-xl mx-auto">
                  Browse our range of certified cylinders available for booking.
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cylinders.map((cylinder, index) => (
                    <div
                      key={`${cylinder.cylinderName}-${cylinder.cylinderType}-${index}`}
                      className="group border border-slate-200 rounded-2xl p-6 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Icon area */}
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 mb-5">
                        <Flame className="w-7 h-7 text-orange-500" />
                      </div>

                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-slate-900 text-base leading-snug">
                          {getCylinderNameLabel(cylinder.cylinderName)}
                        </h3>
                        <span className="ml-2 shrink-0 text-xs font-medium bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5 mt-0.5">
                          {getCylinderTypeLabel(cylinder.cylinderType)}
                        </span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                          <span className="font-medium text-slate-700">
                            {cylinder.weight || "N/A"} kg
                          </span>{" "}
                          weight
                        </div>
                        <div className="text-xl font-extrabold text-emerald-600">
                          ₹{cylinder.price?.toLocaleString() || "N/A"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── CTA ──────────────────────────────────────────────── */}
        <section className="py-24 px-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(16,185,129,0.12) 0%, transparent 65%)",
            }}
          />
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 tracking-tight">
              Ready to Get{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Started?
              </span>
            </h2>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed">
              Join a growing network of agents and customers who trust GASco for seamless
              gas cylinder management.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-10 h-12 rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                >
                  Create Free Account
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border border-white/20 text-white bg-white/5 hover:bg-white/10 font-semibold px-10 h-12 rounded-xl backdrop-blur transition-all duration-200 hover:-translate-y-0.5"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Flame className="w-4 h-4 text-emerald-400" />
            GASco Agencies
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} GASco Agencies — All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
