import LandingPage from "./pages/LandingPage"
import { BrowserRouter , Routes ,Route} from 'react-router-dom'
import SignupPage from "./pages/SignupPage"
import LoginPage from "./pages/LoginPage"
import VerifyOtpPage from "./pages/VerifyOtpPage"
function App() {
  return (
   <BrowserRouter>
     <Routes>
       <Route path="/" element={<LandingPage/>}/>
       <Route path="/signup" element={<SignupPage/>}/>
       <Route path="/signin" element={<LoginPage/>}/>
       <Route path="/verify-otp" element={<VerifyOtpPage/>}/>

     </Routes>
   </BrowserRouter>
  )
}

export default App