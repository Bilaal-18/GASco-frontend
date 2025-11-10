import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "../components/Navbar";
import axios from "@/config/config";
import { 
  Users, 
  UserCog, 
  Package, 
  TrendingUp, 
  Shield, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Loader2
} from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState({ agents: 0, customers: 0 });
  const [cylinders, setCylinders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Navbar />

      
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
          <div className="relative max-w-7xl mx-auto px-6 py-20 sm:py-32">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-6xl sm:text-7xl font-bold text-slate-800 mb-6 leading-tight">
                Welcome to <span className="text-blue-600">GASco</span>
              </h1>
              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Your trusted partner for efficient gas distribution management. 
                Connect with agents, manage bookings, and streamline your gas cylinder operations.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
                <Link to="/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all">
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="rounded-xl px-8 py-6 text-lg border-2 hover:bg-slate-50">
                    Login
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

      
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-slate-800 mb-4">Our Network</h2>
              <p className="text-lg text-slate-600">Trusted by thousands across the region</p>
            </motion.div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-4">
                        <UserCog className="w-12 h-12 opacity-90" />
                        <div className="text-right">
                          <p className="text-5xl font-bold">{stats.agents}</p>
                          <p className="text-blue-100 text-sm mt-1">Active Agents</p>
                        </div>
                      </div>
                      <p className="text-blue-50 text-sm">
                        Professional agents delivering quality service across the region
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-4">
                        <Users className="w-12 h-12 opacity-90" />
                        <div className="text-right">
                          <p className="text-5xl font-bold">{stats.customers}</p>
                          <p className="text-green-100 text-sm mt-1">Happy Customers</p>
                        </div>
                      </div>
                      <p className="text-green-50 text-sm">
                        Customers relying on us for their gas cylinder needs
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}
          </div>
        </section>

      
        <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-slate-800 mb-4">Available Cylinder Types</h2>
              <p className="text-lg text-slate-600">Choose from our wide range of high-quality gas cylinders</p>
            </motion.div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : cylinders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cylinders.map((cylinder, index) => (
                  <motion.div
                    key={`${cylinder.cylinderName}-${cylinder.cylinderType}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 bg-white">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-xl font-bold text-slate-800">
                            {getCylinderNameLabel(cylinder.cylinderName)}
                          </CardTitle>
                          <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          {getCylinderTypeLabel(cylinder.cylinderType)}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-t">
                          <span className="text-sm text-slate-600 font-medium">Weight</span>
                          <span className="text-lg font-semibold text-slate-800">
                            {cylinder.weight || 'N/A'} kg
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-t">
                          <span className="text-sm text-slate-600 font-medium">Price</span>
                          <span className="text-2xl font-bold text-green-600">
                            ₹{cylinder.price?.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-500 text-lg">No cylinders available at the moment</p>
              </div>
            )}
          </div>
        </section>

        
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-slate-800 mb-4">Why Choose Us?</h2>
              <p className="text-lg text-slate-600">Experience seamless gas distribution management</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <Card className="p-6 hover:shadow-lg transition-all duration-300 border-slate-200">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCog className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl mb-3">For Agents</CardTitle>
                  <CardContent className="text-slate-600">
                    Manage deliveries, register customers, and track your performance directly from your portal.
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-center"
              >
                <Card className="p-6 hover:shadow-lg transition-all duration-300 border-slate-200">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl mb-3">For Admins</CardTitle>
                  <CardContent className="text-slate-600">
                    Oversee all operations, manage agents, and ensure smooth gas supply and customer satisfaction.
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center"
              >
                <Card className="p-6 hover:shadow-lg transition-all duration-300 border-slate-200">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl mb-3">For Customers</CardTitle>
                  <CardContent className="text-slate-600">
                    Book cylinders online, track your orders, and make secure payments with ease.
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

    
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-blue-100 mb-8">
                Join thousands of satisfied customers and agents today
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 rounded-xl text-lg shadow-lg">
                    Create Account
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 rounded-xl text-lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-800 text-white text-center py-6 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-slate-300">
            © {new Date().getFullYear()} GASCo Agencies — All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
