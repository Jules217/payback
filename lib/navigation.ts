import {
  LayoutDashboard,
  Users,
  FileText,
  Bell,
  Mail,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

/** Navigation principale du dashboard (sidebar). */
export const dashboardNav: NavItem[] = [
  {
    title: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Vue d'ensemble de l'activité",
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
    description: "Gérer les clients et débiteurs",
  },
  {
    title: "Factures",
    href: "/invoices",
    icon: FileText,
    description: "Suivre les factures en retard",
  },
  {
    title: "Relances",
    href: "/reminders",
    icon: Bell,
    description: "Scénarios et historique de relance",
  },
  {
    title: "Modèles",
    href: "/templates",
    icon: Mail,
    description: "Modèles de messages",
  },
  {
    title: "Paramètres",
    href: "/settings",
    icon: Settings,
    description: "Organisation et préférences",
  },
];
