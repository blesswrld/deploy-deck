"use client";

import { motion } from "framer-motion";
import { GitBranch, Package, AlertTriangle, CheckCircle2 } from "lucide-react";

interface DashboardSummaryProps {
    totalProjects: number;
    deployingCount: number;
    failedCount: number;
    readyCount: number;
}

export const DashboardSummary = ({
    totalProjects,
    deployingCount,
    failedCount,
    readyCount,
}: DashboardSummaryProps) => {
    const summaryItems = [
        {
            title: "Total Projects",
            value: totalProjects,
            icon: Package,
            iconColor: "text-muted-foreground",
        },
        {
            title: "Deploying",
            value: deployingCount,
            icon: GitBranch,
            iconColor: "text-yellow-500",
        },
        {
            title: "Failed",
            value: failedCount,
            icon: AlertTriangle,
            iconColor: "text-red-500",
        },
        {
            title: "Ready",
            value: readyCount,
            icon: CheckCircle2,
            iconColor: "text-green-500",
        },
    ];

    return (
        <motion.div
            className="hidden lg:flex flex-wrap items-center gap-6 border-r border-border pr-6 pl-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {summaryItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                    <span className="text-sm font-medium">{item.value}</span>
                    <span className="text-sm text-muted-foreground">
                        {item.title}
                    </span>
                </div>
            ))}
        </motion.div>
    );
};
