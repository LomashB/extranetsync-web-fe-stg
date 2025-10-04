"use client";

import React, { useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Building, Globe, Database, Calendar, BarChart3, Link as LinkIcon, Settings, Users2, Shield, UserCircle, Menu, ChevronDown, X, LogOut, MapPin } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import UnauthorizedModal from "./UnauthorizedModel";
import { useLoading } from "../../context/LoadingContext";
import { Roboto_Slab } from "next/font/google";
import Button from "@components/UI/Button";
import Modal from "@components/UI/Modal";
import Image from "next/image";

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

interface MenuItem {
  href?: string;
  label: string;
  icon: React.ElementType;
  children?: MenuItem[];
  isExpanded?: boolean;
}

interface MobileSidebarContentProps {
  pathname: string | null;
  menuItems: MenuItem[];
  onItemClick: () => void;
  toggleExpanded: (label: string) => void;
  expandedItems: string[];
}

interface SidebarContentProps {
  isSidebarOpen: boolean;
  pathname: string | null;
  menuItems: MenuItem[];
  toggleExpanded: (label: string) => void;
  expandedItems: string[];
}

interface AdminLayoutProps {
  children: ReactNode;
}

interface AdminUser {
  _id: string;
  name: string;
  mobile_number: string;
  email: string;
  role: {
    _id: string;
    name: string;
    role_for: string;
    permissions: string[];
  };
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const menuItems = [
  { href: "/admin/calendar", label: "Calendar", icon: Calendar },
  { href: "/admin/properties", label: "Properties", icon: Building },
  { href: "/admin/room-mapping", label: "Room Mapping", icon: LinkIcon }, 
  { 
    label: "Settings",
    icon: Settings,
    children: [
      { href: "/admin/settings/users", label: "User Management", icon: Users2 },
      { href: "/admin/settings/roles-permissions", label: "Roles & Permissions", icon: Shield },
      { href: "/admin/settings/profile", label: "Profile", icon: UserCircle },
    ],
  },
];

// Mobile sidebar content
const MobileSidebarContent: React.FC<MobileSidebarContentProps> = ({
  pathname,
  menuItems,
  onItemClick,
  toggleExpanded,
  expandedItems,
}) => (
  <>
    <nav className="flex-1 overflow-y-auto py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-gray-600 hover:[&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full">
      <ul className="space-y-1">
        {menuItems.map((item: MenuItem) => (
          <li key={item.label}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <item.icon className="flex-shrink-0 h-5 w-5 mr-3" />
                  <span className="text-sm font-medium flex-grow text-left">
                    {item.label}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 ml-2 flex-shrink-0 transition-transform duration-200 ease-in-out ${
                      expandedItems.includes(item.label) ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    expandedItems.includes(item.label)
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <ul className="mt-1 space-y-1 pl-11">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href!}
                          onClick={onItemClick}
                          className={`flex items-center py-2 px-4 ${
                            pathname && pathname === child.href
                              ? "bg-[#f1f1f1] text-black font-medium"
                              : "text-gray-300 hover:bg-[#f1f1f130]"
                          }`}
                        >
                          <child.icon className="flex-shrink-0 h-4 w-4 mr-3" />
                          <span className="text-sm">{child.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <Link
                href={item.href!}
                onClick={onItemClick}
                className={`flex items-center px-4 py-3 ${
                  pathname && pathname === item.href
                    ? "bg-[#f1f1f1] text-black font-medium"
                    : "text-gray-300 hover:bg-[#f1f1f130]"
                }`}
              >
                <item.icon className="flex-shrink-0 h-5 w-5 mr-3" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
    <div className="p-4 mt-auto border-t border-gray-700">
      <div className="text-xs text-gray-400">
        <p className="font-medium mb-1">Extranetsync Admin Portal</p>
        <p className="opacity-75">v1.0.0</p>
      </div>
    </div>
  </>
);

// Desktop sidebar content
const SidebarContent: React.FC<SidebarContentProps> = ({
  isSidebarOpen,
  pathname,
  menuItems,
  toggleExpanded,
  expandedItems,
}) => (
  <>
    <nav className="flex-1 overflow-y-auto pt-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-gray-600 hover:[&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full">
      <ul className="space-y-2 px-3 pb-6">
        {menuItems.map((item: MenuItem) => (
          <li key={item.label}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className={`flex items-center w-full p-2 rounded-md transition-all duration-200 text-gray-300 hover:bg-[#f1f1f130] ${
                    !isSidebarOpen && "justify-center"
                  }`}
                >
                  <item.icon
                    className={`flex-shrink-0 ${
                      isSidebarOpen ? "h-5 w-5" : "h-4 w-4"
                    }`}
                  />
                  {isSidebarOpen && (
                    <>
                      <span className="ml-3 text-sm font-medium flex-grow text-left">
                        {item.label}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 ml-2 flex-shrink-0 transition-transform duration-200 ease-in-out ${
                          expandedItems.includes(item.label) ? "rotate-180" : ""
                        }`}
                      />
                    </>
                  )}
                </button>
                {isSidebarOpen && (
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-in-out ${
                      expandedItems.includes(item.label)
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <ul className="mt-1 space-y-1 pl-7">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href!}
                            className={`flex items-center py-2 px-2 rounded-md ${
                              pathname && pathname === child.href
                                ? "bg-[#f1f1f1] text-black"
                                : "text-gray-300 hover:bg-[#f1f1f130]"
                            }`}
                          >
                            <child.icon className="flex-shrink-0 h-4 w-4 mr-3" />
                            <span className="text-sm">{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href!}
                className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                  pathname && pathname === item.href
                    ? "bg-[#f1f1f1] text-black"
                    : "text-gray-300 hover:bg-[#f1f1f130]"
                } ${!isSidebarOpen && "justify-center"}`}
              >
                <item.icon
                  className={`flex-shrink-0 ${
                    isSidebarOpen ? "h-5 w-5" : "h-4 w-4"
                  }`}
                />
                {isSidebarOpen && (
                  <span className="ml-3 text-sm font-medium">{item.label}</span>
                )}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
    {isSidebarOpen && (
      <div className="p-4 mt-auto border-t border-gray-700">
        <div className="text-xs text-gray-400">
          <p className="font-medium mb-1">Extranetsync Admin Portal</p>
          <p className="opacity-75">v1.0.0</p>
        </div>
      </div>
    )}
  </>
);

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "Settings",
  ]);
  const pathname = usePathname();
  const { user: adminUser, logoutAdmin } = useAuth(); // Use logoutAdmin from context
  const { startLoading, stopLoading } = useLoading();

  const adminUserTyped = adminUser as AdminUser | null;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Updated logout handler to use API logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    startLoading();
    try {
      await logoutAdmin(); // Call API logout from AuthContext
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
      stopLoading();
      setDialogOpen(false);
    }
  };

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header
        className={`bg-black px-4 py-2 flex justify-between items-center sticky top-0 z-30 w-full transition-all duration-300 ${
          isMobileMenuOpen ? "lg:block hidden" : "block"
        }`}
      >
        <div className="flex items-center ">
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-md text-white hover:bg-gray-800 transition-all duration-300"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <Image
              src="/assets/extranetsync-full-logo-white.png"
              alt="Extranetsync"
              width={150}
              height={32}
              priority
              className="h-8 w-auto"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Mobile Avatar */}
          <Link
            href="/admin/settings/profile"
            className="sm:hidden p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 bg-[#f1f1f160] rounded-full flex items-center justify-center text-white font-medium">
              {adminUserTyped?.name?.charAt(0) || "A"}
            </div>
          </Link>

          {/* Desktop User Info */}
          <div className="hidden sm:flex items-center space-x-3">
            <Link
              href="/admin/settings/profile"
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 bg-[#f1f1f160] rounded-full flex items-center justify-center text-white font-medium">
                {adminUserTyped?.name?.charAt(0) || "A"}
              </div>
              <div className="text-sm">
                <p className="font-medium text-white">
                  {adminUserTyped?.name || "Admin"}
                </p>
                <p className="text-gray-400 text-xs">
                  {adminUserTyped?.role?.name || "Admin"}
                </p>
              </div>
            </Link>
          </div>
          <Button
            variant="secondary"
            size="sm"
            rightIcon={<LogOut className="h-4 w-4" />}
            onClick={() => setDialogOpen(true)}
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 bg-black overflow-hidden">
        {/* Mobile Menu Overlay */}
        <div
          className={`lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={closeMobileMenu}
        />

        {/* Mobile Sidebar */}
        <div
          className={`lg:hidden fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full bg-black flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black">
              <Image
                src="/assets/extranetsync-full-logo-white.png"
                alt="Extranetsync"
                width={150}
                height={32}
                priority
                className="h-8 w-auto"
              />
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <MobileSidebarContent
                pathname={pathname}
                menuItems={menuItems}
                onItemClick={closeMobileMenu}
                toggleExpanded={toggleExpanded}
                expandedItems={expandedItems}
              />
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div
          className={`hidden lg:block ${
            isSidebarOpen ? "w-64" : "w-20"
          } transition-all duration-300 ease-in-out border-r border-gray-800 flex-shrink-0`}
          onMouseEnter={() => setIsSidebarOpen(true)}
          onMouseLeave={() => setIsSidebarOpen(false)}
        >
          <div className="h-full overflow-hidden flex flex-col">
            <SidebarContent
              isSidebarOpen={isSidebarOpen}
              pathname={pathname}
              menuItems={menuItems}
              toggleExpanded={toggleExpanded}
              expandedItems={expandedItems}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full bg-black">
            <div className="bg-[#f6f6f7] h-full rounded-tl-xl md:rounded-tl-3xl rounded-tr-xl md:rounded-tr-none overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#f6f6f7] [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="p-2 lg:p-6">
                {children}
                <UnauthorizedModal useNewDesign={true} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Dialog */}
      <Modal
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Confirm Logout"
        primaryActionLabel="Logout"
        onPrimaryAction={handleLogout}
        isLoading={isLoggingOut}
        size="sm"
      >
        <p className="text-gray-600">Are you sure you want to logout? This will end your current session.</p>
      </Modal>
    </div>
  );
};

export default AdminLayout;
