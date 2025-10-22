import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {  z } from "zod";
import { useAppDispatch, useAppSelector } from "../hooks/storeHook";
import { doSignup } from "../store/features/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Check, User, Mail, Lock, Building, Divide } from "lucide-react";
import { useState } from "react";


export const signupSchema = z.object({
  username: z.string().min(4, "Username must be at least 4 characters"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain 1 uppercase, 1 lowercase, 1 number, and 1 special character"
    ),
  organizationName: z
    .string()
    .min(3, "Organization name must be at least 3 characters"),
});

type SignUpFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { error } = useAppSelector(state=> state.auth);
  const { register, handleSubmit, formState: { errors, isSubmitting }} = useForm<SignUpFormValues>({
       resolver: zodResolver(signupSchema),
  });

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: SignUpFormValues) => {
  try {
    const result = await dispatch(doSignup(data)).unwrap();
    console.log("Signup result:", result);

    if (result.success) {
      navigate('/verify-otp', {
        state: {
          emailToVerify: data.email,  //  Pass email from form
        },
      });
    }
  } catch (error: any) {
    console.error("Signup error:", error);
  }
};



return (
    <div className="min-h-screen flex items-center justify-center bg-[#c7d2fe] py-6 px-4 sm:px-6 lg:py-10">
  <div className="w-full max-w-5xl bg-white rounded-[32px] shadow-2xl flex flex-col md:flex-row overflow-hidden">
    
    {/* LEFT FORM */}
    <div className="w-full md:w-1/2 px-6 sm:px-10 md:px-12 py-8 md:py-10 flex flex-col">
      <div className="flex items-center justify-between">
        <p className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition">
          <Link to="/">
            <ArrowLeft size={20} />
          </Link>
        </p>
        <p className="text-xs sm:text-sm text-gray-500">
          Already member?{" "}
          <Link to="/signin" className="text-indigo-600 font-semibold">
            Sign in
          </Link>
        </p>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold mt-6 mb-2">Sign Up</h1>
      <p className="text-gray-500 text-sm sm:text-base mb-6">
        Secure Your Communications with TaskFlow Crm
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username */}
        <div className="flex items-center border-b border-gray-200 w-full pb-2 relative mb-3">
          <User size={18} className="text-gray-400" />
          <input
            {...register("username")}
            placeholder="Daniel Ahmadi"
            className="w-full px-3 py-1 border-0 outline-none text-gray-700 placeholder-gray-500 text-sm sm:text-base"
          />
        </div>
        {errors.username && (
          <p className="text-red-500 text-xs sm:text-sm -mt-2">{errors.username.message}</p>
        )}

        {/* Email */}
        <div className="flex items-center border-b border-gray-200 w-full pb-2 relative mb-3">
          <Mail size={18} className="text-gray-400" />
          <input
            {...register("email")}
            placeholder="danielahmadi@gmail.com"
            className="w-full px-3 py-1 border-0 outline-none text-gray-700 placeholder-gray-500 text-sm sm:text-base"
          />
        </div>
        {errors.email && (
          <p className="text-red-500 text-xs sm:text-sm -mt-2">{errors.email.message}</p>
        )}

        {/* Password */}
        <div className="flex items-center border-b border-gray-200 w-full pb-2 relative">
          <Lock size={18} className="text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="••••••••"
            className="w-full px-3 py-1 border-0 outline-none text-gray-700 placeholder-gray-500 text-base tracking-wider"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 text-gray-400 hover:text-gray-600 transition"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.password.message}</p>
        )}

        {/* Password Rules */}
        <ul className="text-xs sm:text-sm text-gray-500 space-y-1 pt-2 mb-4">
          <li className="flex items-center gap-2">
            <Check size={14} className="text-green-500" /> At least 8 characters
          </li>
          <li className="flex items-center gap-2">
            <Check size={14} className="text-green-500" /> One number or symbol
          </li>
          <li className="flex items-center gap-2">
            <Check size={14} className="text-green-500" /> Uppercase & lowercase
          </li>
        </ul>

        {/* Organization */}
        <div className="mb-4 flex items-center border-b border-gray-300 w-full px-2 py-2">
          <Building size={18} className="text-gray-400" />
          <input
            {...register("organizationName")}
            placeholder="Organization name"
            className="w-full px-3 py-1 border-0 outline-none text-gray-700 text-sm sm:text-base"
          />
        </div>
        {errors.organizationName && (
          <p className="text-red-500 text-xs sm:text-sm mb-2">
            {errors.organizationName.message}
          </p>
        )}

        {/* error handling  from backend*/}
        {error && <div className="text-red-500 text-xl ">{error}</div>}
        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex justify-between items-center gap-4 py-3 px-6 text-sm sm:text-base text-white rounded-full bg-indigo-600 hover:bg-indigo-700 transition shadow-md shadow-indigo-200 w-full sm:w-auto"
        >
          {isSubmitting ? "Submitting..." : "Sign Up"}
          <ArrowRight />
        </button>
      </form>
    </div>

    {/* RIGHT SIDE GRAPHICS */}
    <div className="hidden md:block w-1/2 relative overflow-hidden rounded-r-[32px] bg-indigo-500">
      <div className="absolute inset-0 bg-blue-700 transform skew-x-[-12deg] origin-top-left -ml-24"></div>
      <div className="absolute inset-0 bg-indigo-600 transform skew-x-[-18deg] origin-top-left -ml-28"></div>

      <div className="relative z-10 p-6 lg:p-8 flex flex-col items-center justify-center h-full">
        <div className="absolute top-8 right-4 lg:top-10 lg:right-6 flex flex-col gap-3">
          <button className="bg-white rounded-full shadow-lg p-3">
            <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xs">IG</div>
          </button>
          <button className="bg-white rounded-full shadow-lg p-3">
            <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs">TK</div>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-4 w-40 sm:w-44 text-left mt-12 ml-10">
          <h2 className="text-gray-700 text-xs sm:text-sm font-light">Inbox</h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">176,18</p>
          <div className="h-4 w-full mt-3 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full h-1"></div>
            <div className="absolute -top-6 right-8 bg-indigo-600 text-white rounded-full text-xs p-1 px-2 shadow-md">45</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-5 w-52 sm:w-60 mt-6 mr-10">
          <div className="mb-3 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Lock size={18} className="text-indigo-600" />
            </div>
            <div className="flex-grow h-2 bg-gray-200 rounded"></div>
            <div className="h-2 w-8 bg-gray-200 rounded"></div>
          </div>
          <h2 className="text-gray-900 font-bold text-base sm:text-lg">Your data, your rules</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            Your data belongs to you, and our encryption ensures that.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

  );
}
