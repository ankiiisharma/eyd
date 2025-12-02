import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
}

const routeToBreadcrumb: Record<string, string> = {
  dashboard: "Dashboard",
  beneficieries: "Beneficiaries",
  users: "Users",
  "new-user": "New User",
  "edit-user": "Edit User",
  assessments: "Assessments",
  "assessments/new": "New Assessment",
  "assessments/edit": "Edit Assessment",
  inquiries: "Inquiries",
  "inquiries/notes": "Inquiry Notes",
  feedback: "Feedback",
  resources: "Resources",
  notifications: "Notifications",
  settings: "Settings",
  slot: "Slot Management",
  appointments: "Appointments",
  "appointments/notes": "Appointment Notes",
};

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ 
  items, 
  showHome = true 
}) => {
  const location = useLocation();
  
  // If custom items are provided, use them
  if (items) {
    return (
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          {showHome && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard" className="flex items-center gap-1">
                    <Home className="h-4 w-4" />
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {item.href && index < items.length - 1 ? (
                  <BreadcrumbLink asChild>
                    <Link to={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < items.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Auto-generate breadcrumbs from current path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems: BreadcrumbItem[] = [];

  // Build breadcrumb items from path segments
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Handle dynamic segments (like IDs)
    if (segment.match(/^\d+$/) || segment === 'new' || segment === 'edit') {
      // For IDs, we'll use the previous segment context
      if (index > 0) {
        const parentSegment = pathSegments[index - 1];
        const parentLabel = routeToBreadcrumb[parentSegment] || parentSegment;
        breadcrumbItems.push({
          label: segment === 'new' ? 'New' : segment === 'edit' ? 'Edit' : `#${segment}`,
          href: index < pathSegments.length - 1 ? currentPath : undefined
        });
      }
    } else {
      // Handle regular segments
      const label = routeToBreadcrumb[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbItems.push({
        label,
        href: index < pathSegments.length - 1 ? currentPath : undefined
      });
    }
  });

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {showHome && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item.href && index < breadcrumbItems.length - 1 ? (
                <BreadcrumbLink asChild>
                  <Link to={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};