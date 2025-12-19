import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Role = "admin" | "customer";

interface RoleContextType {
  role: Role;
  toggleRole: () => void;
  isAdmin: boolean;
  isCustomer: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("userRole");
      return (saved as Role) || "admin";
    }
    return "admin";
  });

  useEffect(() => {
    localStorage.setItem("userRole", role);
  }, [role]);

  const toggleRole = () => {
    setRole((prev) => (prev === "admin" ? "customer" : "admin"));
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        toggleRole,
        isAdmin: role === "admin",
        isCustomer: role === "customer",
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
