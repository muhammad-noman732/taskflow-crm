import { CheckCircle } from "lucide-react";

interface PricingCardProps{
 title: string;
  description: string;
  price: number;
  frequency: string;
  features: string[];
  buttonText: string;
  badge?: string;
  highlight?: boolean; // for popular plan
}

const PricingCard = ({ title, description, price, frequency, features, buttonText, badge, highlight }: PricingCardProps) => {
  return (
    <div className={`rounded-2xl p-6 shadow-lg border ${highlight ? "border-blue-500 scale-105" : "border-gray-200"} bg-white`}>
      {/* Badge */}
      {badge && (
        <div className="mb-2 inline-block bg-gradient-to-r from-blue-400 to-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
          {badge}
        </div>
      )}

      {/* Title & Description */}
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>

      {/* Price */}
      <div className="text-3xl font-bold mb-4">
        ${price}
        <span className="text-base font-normal">/{frequency}</span>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-4 text-sm">
        {features.map((f, idx) => (
          <li key={idx} className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            {f}
          </li>
        ))}
      </ul>

      {/* Button */}
      <button className={`w-full py-2 rounded-lg font-semibold ${highlight ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-white border border-gray-400 text-gray-700 hover:bg-gray-100"}`}>
        {buttonText}
      </button>
    </div>
  );
};

export default PricingCard;
