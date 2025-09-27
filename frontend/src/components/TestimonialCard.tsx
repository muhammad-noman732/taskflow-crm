import { Users, Star } from "lucide-react";


export interface Testimonial {
  id: number;
  quote: string;
  name: string;
  designation: string;
  iconBg: string; // background color for the icon container
  iconColor: string; // color of the icon
}

const TestimonialCard = ({ quote, name, designation, iconBg, iconColor }: Testimonial) => {
  return (
    <div className="border border-gray-200 p-6 rounded-2xl   flex flex-col space-y-4 transition-all duration-200 hover:shadow-lg hover:bg-gray-50">
      {/* Star rating */}
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 text-yellow-400" />
        ))}
      </div>

      {/* Quote */}
      <p className="text-gray-600">{quote}</p>

      {/* User info */}
      <div className="flex items-center space-x-3 mt-2">
        <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center`}>
          <Users className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <div className="font-semibold text-black">{name}</div>
          <div className="text-sm text-gray-500">{designation}</div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
