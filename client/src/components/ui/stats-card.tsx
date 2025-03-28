import { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  bgColor?: string;
  textColor?: string;
  subLabel?: string;
}

export function StatsCard({
  icon,
  label,
  value,
  bgColor = "bg-primary-50",
  textColor = "text-primary-500",
  subLabel
}: StatsCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${bgColor} p-3 rounded-md`}>
          <div className={`text-xl ${textColor}`}>{icon}</div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-neutral-500">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {subLabel && <p className="text-xs text-neutral-400">{subLabel}</p>}
        </div>
      </div>
    </div>
  );
}
