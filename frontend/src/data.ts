import {
  BarChart3,
  Clock,
  FileText,
  Users,
  Shield,
  Zap,
} from "lucide-react";

export interface FeatureData {
  title: string;
  description: string;
  icon: any; // LucideIcon
  bgColor: string; // Tailwind background for icon
  iconColor: string; // Tailwind text color for icon
}

export const features: FeatureData[] = [
  {
    title: "Project Management",
    description: "Organize tasks, track progress, and collaborate with your team in real-time",
    icon: BarChart3,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-500",
  },
  {
    title: "Time Tracking",
    description: "Accurate time tracking with automatic timers and detailed reporting",
    icon: Clock,
    bgColor: "bg-green-100",
    iconColor: "text-green-500",
  },
  {
    title: "Smart Invoicing",
    description: "Generate professional invoices automatically from tracked time and expenses",
    icon: FileText,
    bgColor: "bg-yellow-100",
    iconColor: "text-yellow-500",
  },
  {
    title: "Team Collaboration",
    description: "Built-in chat, file sharing, and real-time updates keep everyone aligned",
    icon: Users,
    bgColor: "bg-red-100",
    iconColor: "text-red-500",
  },
  {
    title: "Advanced Security",
    description: "Enterprise-grade security with role-based permissions and data encryption",
    icon: Shield,
    bgColor: "bg-indigo-100",
    iconColor: "text-indigo-500",
  },
  {
    title: "AI Insights",
    description: "Intelligent analytics and predictions to optimize your business performance",
    icon: Zap,
    bgColor: "bg-purple-100",
    iconColor: "text-purple-500",
  },
];



export interface PricingPlan {
  title: string;
  description: string;
  price: number;
  frequency: string;
  features: string[];
  buttonText: string;
  badge?: string;
  highlight?: boolean; // for popular plan
}

export const pricingPlans: PricingPlan[] = [
  {
    title: "Starter",
    description: "Perfect for small teams getting started",
    price: 19,
    frequency: "month",
    features: ["Up to 5 team members", "10 projects", "Basic time tracking", "Standard invoicing", "Email support"],
    buttonText: "Get Started",
  },
  {
    title: "Professional",
    description: "Best for growing businesses",
    price: 49,
    frequency: "month",
    features: ["Up to 25 team members", "Unlimited projects", "Advanced time tracking", "Smart invoicing & automation", "Priority support", "Advanced reporting"],
    buttonText: "Get Started",
    badge: "Most Popular",
    highlight: true,
  },
  {
    title: "Enterprise",
    description: "For large organizations",
    price: 99,
    frequency: "month",
    features: ["Unlimited team members", "Everything in Professional", "AI insights & predictions", "Custom integrations", "24/7 dedicated support", "SSO & advanced security"],
    buttonText: "Contact Sales",
  },
];




export interface Testimonial {
  id: number;
  quote: string;
  name: string;
  designation: string;
  iconBg: string; // background color for the icon container
  iconColor: string; // color of the icon
}

export const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "TaskFlow CRM transformed our project management. We've seen a 40% increase in productivity and our clients love the transparency.",
    name: "Sarah Johnson",
    designation: "CEO, TechStart Inc.",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
  },
  {
    id: 2,
    quote: "The automated invoicing feature alone has saved us 20 hours per month. The ROI was immediate.",
    name: "Michael Chen",
    designation: "Founder, Creative Studio",
    iconBg: "bg-green-100",
    iconColor: "text-green-500",
  },
  {
    id: 3,
    quote: "Best CRM we've used. The team collaboration features keep everyone on the same page effortlessly.",
    name: "Emily Rodriguez",
    designation: "Operations Manager, Growth Co.",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-500",
  },
];
