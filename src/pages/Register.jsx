import { useFormik } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";
import { useContext, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import UserContext from "../context/UserContext";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";

export default function Register() {
  const { handleRegister } = useContext(UserContext);
  const [role, setRole] = useState("agent");

  // Yup validation schema
  const validationSchema = Yup.object().shape({
    role: Yup.string().required("Role is required"),
    
    // Agent-specific validations
    agentname: Yup.string().when("role", {
      is: "agent",
      then: (schema) => schema
        .required("Agent name is required")
        .min(3, "Name must be at least 3 characters")
        .max(50, "Name must not exceed 50 characters")
        .matches(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
      otherwise: (schema) => schema.notRequired(),
    }),
    
    vehicleNo: Yup.string().when("role", {
      is: "agent",
      then: (schema) => schema
        .required("Vehicle number is required")
        .matches(
          /^[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,2}[-\s]?[0-9]{1,4}$/i,
          "Invalid vehicle number format (e.g., KA-09-AB-1234)"
        ),
      otherwise: (schema) => schema.notRequired(),
    }),
    
    // Admin-specific validation
    adminName: Yup.string().when("role", {
      is: "admin",
      then: (schema) => schema
        .required("Admin name is required")
        .min(3, "Name must be at least 3 characters")
        .max(50, "Name must not exceed 50 characters")
        .matches(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
      otherwise: (schema) => schema.notRequired(),
    }),
    
    // Common field validations
    email: Yup.string()
      .required("Email is required")
      .email("Invalid email format")
      .matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address"
      ),
    
    phoneNo: Yup.string()
      .required("Phone number is required")
      .matches(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number")
      .length(10, "Phone number must be exactly 10 digits"),
    
    password: Yup.string()
      .required("Password is required")
      .min(8, "Password must be at least 8 characters")
      .max(20, "Password must not exceed 20 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
  });

  const formik = useFormik({
    initialValues: {
      role: "agent",
      agentname: "",
      vehicleNo: "",
      email: "",
      phoneNo: "",
      password: "",
      adminName: "",
    },
    validationSchema: validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values, { resetForm }) => {
      let payload = { ...values };
      if (role === "agent") {
        delete payload.adminName;
      } else if (role === "admin") {
        delete payload.agentname;
        delete payload.vehicleNo;
      }
      payload.role = role;
      console.log("Submitting:", payload);
      handleRegister(payload, resetForm);
    },
  });

  // Update role in formik when select changes
  const handleRoleChange = (value) => {
    setRole(value);
    formik.setFieldValue("role", value);
    // Clear conditional fields when role changes
    if (value === "admin") {
      formik.setFieldValue("agentname", "");
      formik.setFieldValue("vehicleNo", "");
    } else {
      formik.setFieldValue("adminName", "");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <Navbar />
      <Toaster richColors position="top-right" />

      <main className="flex-1 flex justify-center items-center p-6">
        <motion.div
          className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md shadow-xl rounded-2xl border border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-center text-slate-800">
                Register to Gasco Portal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                {/* Role Selection */}
                <div>
                  <Label>Register as</Label>
                  <Select
                    value={role}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {formik.touched.role && formik.errors.role && (
                    <p className="text-sm text-red-500 mt-1">{formik.errors.role}</p>
                  )}
                </div>

                {/* Conditional Fields - Agent */}
                {role === "agent" && (
                  <>
                    <div>
                      <Label>Agent Name</Label>
                      <Input
                        name="agentname"
                        placeholder="Enter your name"
                        value={formik.values.agentname}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={
                          formik.touched.agentname && formik.errors.agentname
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {formik.touched.agentname && formik.errors.agentname && (
                        <p className="text-sm text-red-500 mt-1">{formik.errors.agentname}</p>
                      )}
                    </div>
                    <div>
                      <Label>Vehicle Number</Label>
                      <Input
                        name="vehicleNo"
                        placeholder="KA-09-AB-1234"
                        value={formik.values.vehicleNo}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={
                          formik.touched.vehicleNo && formik.errors.vehicleNo
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {formik.touched.vehicleNo && formik.errors.vehicleNo && (
                        <p className="text-sm text-red-500 mt-1">{formik.errors.vehicleNo}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Conditional Fields - Admin */}
                {role === "admin" && (
                  <div>
                    <Label>Admin Name</Label>
                    <Input
                      name="adminName"
                      placeholder="Enter admin name"
                      value={formik.values.adminName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={
                        formik.touched.adminName && formik.errors.adminName
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {formik.touched.adminName && formik.errors.adminName && (
                      <p className="text-sm text-red-500 mt-1">{formik.errors.adminName}</p>
                    )}
                  </div>
                )}

                {/* Common Fields */}
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={
                      formik.touched.email && formik.errors.email
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="text-sm text-red-500 mt-1">{formik.errors.email}</p>
                  )}
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <Input
                    name="phoneNo"
                    placeholder="10-digit number"
                    value={formik.values.phoneNo}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    maxLength={10}
                    className={
                      formik.touched.phoneNo && formik.errors.phoneNo
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formik.touched.phoneNo && formik.errors.phoneNo && (
                    <p className="text-sm text-red-500 mt-1">{formik.errors.phoneNo}</p>
                  )}
                </div>

                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="********"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={
                      formik.touched.password && formik.errors.password
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formik.touched.password && formik.errors.password && (
                    <p className="text-sm text-red-500 mt-1">{formik.errors.password}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Must contain uppercase, lowercase, number, and special character
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 gap-3">
                  <Link to="/">
                    <Button variant="outline" className="rounded-xl">
                      ← Back to Home
                    </Button>
                  </Link>

                  <Button
                    type="submit"
                    disabled={!formik.isValid || formik.isSubmitting}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formik.isSubmitting ? "Registering..." : "Register"}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="text-sm text-center text-slate-500">
              Already have an account?{" "}
              <a href="/login" className="text-slate-800 font-medium hover:underline">
                Login here
              </a>
            </CardFooter>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}