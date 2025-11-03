import { useFormik } from "formik";
import * as Yup from "yup";
import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import userContext from "@/context/UserContext";
import { Toaster } from "sonner";

export default function Login(props) {
  const { handleLogin }= useContext(userContext)
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string().required("Password is required"),
    }),
    onSubmit: async (values, { resetForm }) => {
        await handleLogin(values,resetForm)
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex flex-col transition-colors duration-300">
      <Navbar />
      <Toaster richColors position="top-right" />

      <main className="flex-1 flex justify-center items-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-md border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Login to GASCO
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.email}
                    placeholder="Enter your email"
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                    placeholder="Enter your password"
                  />
                  {formik.touched.password && formik.errors.password && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex justify-between items-center pt-4">
                  <Link to="/">
                    <Button variant="outline" className="rounded-xl">
                      ← Back to Home
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                  >
                    Login
                  </Button>
                </div>

                <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-4">
                  Don’t have an account?{" "}
                  <Link
                    to="/Register"
                    className="text-slate-800 dark:text-slate-100 font-semibold hover:underline"
                  >
                    Register
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
