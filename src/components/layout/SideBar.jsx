import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import userContext from "@/context/UserContext";
import { LogOut, Users, Package, UserCog, LayoutDashboard, CylinderIcon, ShoppingCart, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export default function Sidebar() {
  const { handleLogout, user } = useContext(userContext);
  const navigate = useNavigate();
  const location = useLocation();

  const Logout = () => {
    handleLogout();
    navigate("/login");
  };

  const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, url: "/admin" },
    { title: "Manage Agents", icon: UserCog, url: "/admin/manage-agents" },
    { title: "Manage Customers", icon: Users, url: "/admin/manage-customers" },
    { title: "Manage Stocks", icon: Package, url: "/admin/manage-stocks" },
    { title: "Manage Cylinders", icon: CylinderIcon, url: "/admin/manage-cylinders" },
    { title: "Agent Stock", icon: Package, url: "/admin/manage-agentstock" },
    { title: "Gas Requests", icon: ShoppingCart, url: "/admin/gas-requests" },
    { title: "Payments Received", icon: Wallet, url: "/admin/payments" },
  ];

  return (
    <SidebarComponent>
      <SidebarHeader>
        <h2 className="text-xl font-semibold text-center">
          Admin Panel
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
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon size={18} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <div className="text-sm text-sidebar-foreground/70 mb-3 px-2">
            <p className="font-medium">{user.username}</p>
            <p className="text-xs text-sidebar-foreground/50">{user.email}</p>
          </div>
        )}
        <SidebarSeparator />
        <Button
          onClick={Logout}
          variant="destructive"
          className="w-full flex items-center justify-center gap-2"
        >
          <LogOut size={16} /> Logout
        </Button>
      </SidebarFooter>
    </SidebarComponent>
  );
}
