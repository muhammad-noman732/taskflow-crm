import { CheckCircle } from "lucide-react";

const BenifitSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side: benefits */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Why Choose TaskFlow CRM?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                Join thousands of businesses that have transformed their operations with our platform
              </p>
            </div>

            <div className="space-y-6">
              {[ 
                { title: "Increase Productivity by 40%", desc: "Streamlined workflows and automation eliminate manual tasks and reduce errors" },
                { title: "Faster Payments", desc: "Automated invoicing and payment reminders reduce collection time by 60%" },
                { title: "Better Team Communication", desc: "Centralized communication reduces email clutter and improves collaboration" },
                { title: "Data-Driven Decisions", desc: "Real-time analytics and reporting provide insights to optimize your business" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side: success metrics */}
          <div className="relative">
            <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-lg mx-auto">
              <h3 className="font-semibold mb-4 text-lg">Success Metrics</h3>
              <div className="space-y-4">
                {[
                  { label: "Project Completion Rate", value: 94, color: "bg-green-500" },
                  { label: "Client Satisfaction", value: 98, color: "bg-blue-500" },
                  { label: "Revenue Growth", value: 156, color: "bg-yellow-500" },
                ].map((metric, idx) => {
                  // Cap the width at 100% so bar doesn't overflow
                  const width = metric.value > 100 ? 100 : metric.value;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{metric.label}</span>
                        <span>{metric.value}%</span>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2">
                        <div
                          className={`${metric.color} h-2 rounded-full`}
                          style={{ width: `${width}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BenifitSection;
