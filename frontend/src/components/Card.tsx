import type { LucideIcon } from "lucide-react";
import type { FC } from "react";


interface CardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}

const Card: FC<CardProps> = ({ title, description, icon: Icon, bgColor, iconColor }) => {
  return (
    <div className="bg-white hover:bg-gray-100 rounded-2xl border border-xl border-gray-200  p-6 flex flex-col items-start hover:shadow-xl transition-shadow duration-300">
      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <h3 className="text-lg font-bold space-y-2">{title} </h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default Card;
