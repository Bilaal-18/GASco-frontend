import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "../components/Navbar";
import axios from "@/config/config";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
export default function Home() {
  const [stats, setStats] = useState({ agents: 0, customers: 0 });
  const [cylinders, setCylinders] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    toast.info("Server may respond slowly", {
      description: "The server is currently running on a free tier hosting service, so initial requests may take longer to load.",
      action: {
        label: "OK",
        onClick: () => {}
      }
    });


    const fetchHomeData = async () => {
      try {
        const [statsRes, cylindersRes] = await Promise.all([
          axios.get('/api/public/stats').catch(() => ({ data: { agents: 0, customers: 0 } })),
          axios.get('/api/public/cylinders').catch(() => ({ data: { cylinders: [] } }))
        ]);

        setStats(statsRes.data || { agents: 0, customers: 0 });
        setCylinders(cylindersRes.data?.cylinders || []);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const getCylinderTypeLabel = (type) => {
    return type === 'commercial' ? 'Commercial' : 'Private Commercial';
  };

  const getCylinderNameLabel = (name) => {
    return name || 'Gas Cylinder';
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-white">
      <Navbar />

      <main className="flex-1">
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold mb-4 text-slate-900">
                Welcome to GASco
              </h1>
              <p className="text-lg mb-8 text-gray-600">
                Modern platform for managing gas cylinders, agents, and customers.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-2 border-slate-900 text-slate-900 hover:bg-slate-50">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white dark:bg-white">
          <div className="max-w-7xl mx-auto px-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-slate-900 mb-2">{stats.agents}</div>
                    <div className="text-sm text-gray-600">Active Agents</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-slate-900 mb-2">{stats.customers}</div>
                    <div className="text-sm text-gray-600">Happy Customers</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">Why Choose Us?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="font-semibold mb-2 text-slate-900">For Agents</div>
                  <div className="text-sm text-gray-600">
                    Manage deliveries, register customers, and track performance.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="font-semibold mb-2 text-slate-900">For Admins</div>
                  <div className="text-sm text-gray-600">
                    Oversee all operations, manage agents and stock.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="font-semibold mb-2 text-slate-900">For Customers</div>
                  <div className="text-sm text-gray-600">
                    Book cylinders online, track orders, and make payments.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {cylinders.length > 0 && (
          <section className="py-16 bg-white dark:bg-white">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold mb-4">Available Cylinder Types</h2>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cylinders.map((cylinder, index) => (
                    <Card key={`${cylinder.cylinderName}-${cylinder.cylinderType}-${index}`}>
                      <CardContent className="p-4">
                        <div className="font-semibold mb-2">
                          {getCylinderNameLabel(cylinder.cylinderName)}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {getCylinderTypeLabel(cylinder.cylinderType)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm">Weight</span>
                            <span className="text-sm font-semibold">
                              {cylinder.weight || 'N/A'} kg
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Price</span>
                            <span className="text-lg font-bold text-green-600">
                              ₹{cylinder.price?.toLocaleString() || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">Ready to Get Started?</h2>
            <p className="text-lg mb-8 text-gray-600">
              Join thousands of satisfied customers and agents today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800">
                  Create Account
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-2 border-slate-900 text-slate-900 hover:bg-slate-50">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-300">
            © {new Date().getFullYear()} GASCo Agencies — All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
