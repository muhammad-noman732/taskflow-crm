import React from 'react'
import Header from '../components/Header'
import HerSection from '../components/HerSection'
import FeatureSection from '../components/FeatureSection'
import BenifitSection from '../components/BenifitSection'
import PricingSection from '../components/PricingSection'
import Testimonials from '../components/Testimonials'

const LandingPage = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Header/>
      <HerSection/>
      <FeatureSection/>
      <BenifitSection/>
      <PricingSection/>
      <Testimonials/>
    </div>
  )
}

export default LandingPage
