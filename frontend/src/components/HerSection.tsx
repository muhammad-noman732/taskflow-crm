import { 
  BarChart3, 
  Clock, 
  FileText, 
  Zap, 
  ArrowRight,
  CheckCircle,
  Play
} from "lucide-react";

const HeroSection = () => {
  return (
    <header className="relative py-20 lg:py-32 overflow-hidden bg-gray-50">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>

      {/* Content wrapper */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT SIDE: Text content */}
          <section className="space-y-8 max-w-2xl">
            <div className="inline-flex bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />
              New: AI-Powered Insights
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Transform Your Business with{" "}
              <span className="text-blue-600">TaskFlow CRM</span>
            </h1>

            <p className="font-sans text-[20px] font-normal leading-[32.5px] text-[#65758B]">
              The all-in-one business management platform that streamlines your
              projects, tracks time effortlessly, and automates invoicing. Built
              for modern teams who demand excellence.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-500  inline-flex items-center transform  hover:scale-105 
               transition duration-300 ease-in-out">
                <Play className="w-4 h-4 mr-2" /> 
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>

              <button className="bg-white text-gray-900 px-6 py-3 rounded-md font-medium hover:bg-gray-100  inline-flex items-center hover:scale-105 
               transition duration-300 ease-in-out">
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </button>
            </div>

            {/* Features */}
            <div className="flex flex-col sm:flex-row sm:space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </section>

          {/* RIGHT SIDE: Dashboard preview */}
         
          <section className="relative bg-white border border-gray-200 rounded-2xl  p-6 space-y-6 ">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Dashboard</h3>
              <span className="text-sm bg-green-100 text-green-600 px-2 py-1 rounded-full">Live</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h2 className="font-bold text-lg">142</h2>
                <p className="text-xs text-gray-500">Projects</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h2 className="font-bold text-lg">1,247h</h2>
                <p className="text-xs text-gray-500">Tracked</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <FileText className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <h2 className="font-bold text-lg">$89k</h2>
                <p className="text-xs text-gray-500">Invoiced</p>
              </div>
            </div>
          </section>
          </div>
        </div>
    </header>
  );
};

export default HeroSection;
