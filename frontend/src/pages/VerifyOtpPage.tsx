import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../hooks/storeHook";
import { verifyOtp } from "../store/features/authSlice";
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as React from "react";

export const verifyOtpSchema = z.object({
   email: z.string().email("Invalid Email format"),
   otp: z.string().length(6, "OTP must be 6 digits"),
});

// for typescript types...
type VerifyOtpValues = z.infer<typeof verifyOtpSchema>;

const VerifyOtpPage = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(Array(6).fill(""));

  // state from the redux 
  const {error } = useAppSelector(state => state.auth)

  // useref fro the refrence of the input
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // get the email from signup to prefill it instead of manually doing this 
  const emailFromSignup = location.state?.emailToVerify || ""
  const {  register,  handleSubmit,  setValue, formState: { errors, isSubmitting },
  } = useForm<VerifyOtpValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues:{
       email: emailFromSignup
    }
  });

// auto focus on the first input
  React.useEffect(()=>{
          inputRefs.current[0]?.focus()
  },[])
  // handle otp input change
  const handleOtpChange = (value: string, index: number) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      // go to the next input 
     if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
     }
      setOtp(newOtp);
      setValue("otp", newOtp.join("")); // update react hook form value  
    }
  };

  // keydown  when move backspace 
  const handleKeyDown = (e:React.KeyboardEvent , index: number)=>{
    if(e.key === "Backspace" && !otp[index] && index > 0){
         inputRefs.current[index -1 ]?.focus()
    }
  }

  // when whole data paste 
  const handlePaste = (e: React.ClipboardEvent)=>{
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0 ,otp.length);
    if (/^\d+$/.test(pasted)) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      setValue('otp', newOtp.join(''))
    }
    }

  const onSubmit = async (values: VerifyOtpValues) => {
    try {
      const result = await dispatch(verifyOtp(values)).unwrap();
      if (result.success){
          navigate('/')
      }
      console.log("OTP verify result:", result);
    } catch (error) {
      console.error("Error in verify OTP:", error);
    }
  };

  return (
    <div 
      onPaste={handlePaste}
     className="flex justify-center items-center min-h-screen bg-gray-900">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-gray-800 text-white shadow-lg rounded-2xl p-8 space-y-6"
      >
        <h2 className="text-2xl font-bold text-center">Verify Your Otp</h2>
        <p className="text-center text-gray-400 text-sm">
          Enter the 6-digit code sent to your email. This code is valid for the next 10 minutes.
        </p>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...register("email")}
            className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring focus:ring-teal-400"
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* OTP Input */}
         <div className="flex justify-between">
          {otp.map((digit, index) => (
          <input
           key={index}
           ref ={(el) => {inputRefs.current[index] = el}}
           type="text"
           title="otp input"
           maxLength={1}
           value={digit}
           onChange={(e) => handleOtpChange(e.target.value, index)}
           onKeyDown={(e) => handleKeyDown(e, index)}
           className="w-12 h-12 text-center text-xl rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      ))}
     </div>
        {errors.otp && (
          <p className="text-red-400 text-sm text-center">
            {errors.otp.message}
          </p>
        )}

         {/* error from the backend */}
         {error && <div className="text-red-500 text-xl ">{error}</div>}
        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? "Verifying..." : "Verify Otp"}
        </button>

        {/* Resend */}
        <p className="text-center text-sm text-gray-400">
          Didn’t get the code?{" "}
          <button type="button" className="text-teal-400 hover:underline">
            Resend code
          </button>
        </p>

        {/* Footer */}
        <div className="flex justify-between text-xs text-gray-500 mt-6">
          <button type="button" className="hover:underline">Need help?</button>
          <button type="button" className="hover:underline">Send feedback</button>
        </div>
      </form>
    </div>
  );
};

export default VerifyOtpPage;
