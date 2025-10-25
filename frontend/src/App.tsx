import LandingPage from "./pages/LandingPage"
import { BrowserRouter , Routes ,Route} from 'react-router-dom'
import SignupPage from "./pages/SignupPage"
import LoginPage from "./pages/LoginPage"
import VerifyOtpPage from "./pages/VerifyOtpPage"
import ResetPassword from "./pages/ResetPasswordPage/ResetPassword"
import { useEffect } from "react"
function App() {

  useEffect(()=>{
        
  },[])
  return (
   <BrowserRouter>
     <Routes>
       <Route path="/" element={<LandingPage/>}/>
       <Route path="/signup" element={<SignupPage/>}/>
       <Route path="/signin" element={<LoginPage/>}/>
       <Route path="/verify-otp" element={<VerifyOtpPage/>}/>
       <Route path="/reset-password" element={<ResetPassword/>}/>

     </Routes>
   </BrowserRouter>
  )
}

export default App