import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {  z } from "zod";
import { useAppDispatch, useAppSelector } from "../hooks/storeHook";
import { doLogin } from "../store/features/authSlice";
import { useNavigate } from "react-router-dom";
import { doForgotPassword } from "../store/features/authSlice";

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character"
    ),
});

type LoginFormValues = z.infer<typeof loginSchema>;


const LoginPage = () => {
  const { error } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    // watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      console.log("data in login", data);
      const result = await dispatch(doLogin(data)).unwrap();
      if (result.success) {
        navigate("/");
      }
      console.log("result of the login action ", result);
    } catch (error: any) {
      console.error("login error ", error.message);
    }
  };


  // handle forgot password
   const  handleForgotPassword =async ()=>{
       try {
        const email = getValues("email")
         const result = await dispatch(doForgotPassword({email})).unwrap();
         console.log("result of forgot password action" , result)

       } catch (error:any) {
         console.error("login error ", error.message);
       }
   }


  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-900 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-gray-800 text-white shadow-lg rounded-2xl p-8 space-y-6"
      >
        {/* Heading */}
        <h2 className="text-3xl font-bold text-center">Welcome Back 👋</h2>
        <p className="text-center text-gray-400 text-sm">
          Please sign in to continue to your account.
        </p>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...register("email")}
            placeholder="Enter your email"
            className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            {...register("password")}
            placeholder="Enter your password"
            className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Backend Error */}
        {error && (
          <div className="text-red-500 text-center font-medium text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>

        {/* Footer links */}
        <div className="flex justify-between text-xs text-gray-400 mt-4">
          <button type="button" onClick={handleForgotPassword} className="hover:text-teal-400">
            Forgot Password?
          </button>
          <button
            type="button"
            className="hover:text-teal-400"
            onClick={() => navigate("/signup")}
          >
            Create an account
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
