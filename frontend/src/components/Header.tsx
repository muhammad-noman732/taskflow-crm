import { useState } from 'react'
// import { Link } from 'react-router-dom'
import {
    BarChart3,
    X,
    Menu

} from 'lucide-react'


const Header = () => {

    const [mobileMenuOpen, setMobileMenuOpen] = useState<Boolean>(false)
    return (
        <div className="border-b border-gray-300 bg-white/95 backdrop-blur sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className='flex justify-between items-center py-4 '>
                    {/* logo */}
                    <div className='flex items-center space-x-2'>
                        <div className='w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center'>
                            <BarChart3 className='w-5 h-5 text-white' />
                        </div>
                        <span className="text-xl font-bold text-gray-900">TaskFlow CRM</span>
                    </div>

                    {/* navbar items */}
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-gray-800 hover:text-blue-600 transition-colors">Features</a>
                        <a href="#pricing" className="text-gray-800 hover:text-blue-600 transition-colors">Pricing</a>
                        <a href="#testimonials" className="text-gray-800 hover:text-blue-600 transition-colors">Testimonials</a>

                        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 text-gray-700 px-2 py-1 hover:bg-blue-100">
                            Sign In
                        </button>

                        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white px-3 py-2 hover:bg-blue-500">
                            Get Started
                        </button>
                    </div>

                    {/* mobile menu button (always visible on mobile) */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
                    

                {/* mobile menu */}
                {mobileMenuOpen &&
                    (
                        <div className='md:hidden py-4 border-t'>
                            <div className='flex flex-col space-y-4'>
                                <a href="#features" className="text-gray-800 hover:text-blue-600 transition-colors">Features</a>
                                <a href="#pricing" className="text-gray-800 hover:text-blue-600 transition-colors">Pricing</a>
                                <a href="#testimonials" className="text-gray-800 hover:text-blue-600 transition-colors">Testimonials</a>

                                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 text-gray-700 px-2 py-1 hover:bg-blue-100">
                                    Sign In
                                </button>

                                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white px-3 py-2 hover:bg-blue-500">
                                    Get Started
                                </button>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    )
}

export default Header
