import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, User, ShoppingCart, CylinderIcon, UserCheck, Wallet, LogOut } from "lucide-react";
import { useContext } from "react";
import userContext from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const CustomerSidebar = () => {
  const { handleLogout } = useContext(userContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    handleLogout();
    navigate("/login");
  };

  const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, url: "/customer/dashboard" },
    { title: "Profile", icon: User, url: "/customer/profile" },
    { title: "My Bookings", icon: ShoppingCart, url: "/customer/bookings" },
    { title: "Available Cylinders", icon: CylinderIcon, url: "/customer/cylinders" },
    { title: "Assigned Agent", icon: UserCheck, url: "/customer/agent" },
    { title: "Payment Details", icon: Wallet, url: "/customer/payments" },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <h2 className="text-xl font-semibold text-center">
          Customer Panel
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url || location.pathname.startsWith(item.url + "/")}
                  >
                    <NavLink to={item.url}>
                      <item.icon size={18} />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          onClick={handleLogoutClick}
          variant="destructive"
          className="w-full flex items-center justify-center gap-2"
        >
          <LogOut size={16} /> Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default CustomerSidebar;




