import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { doResetPassword } from "../../store/features/authSlice";
import { useLocation, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  // Schema
  const resetPasswordSchema = z
    .object({
      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character"
        ),
      confirmNewPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character"
        ),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "Passwords do not match",
      path: ["confirmNewPassword"],
    });

  // Types
  type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

  const { error, loading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // get token from URL
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const token: string = query.get("token") || "";

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      const result = await dispatch(
        doResetPassword({ ...data, token })
      ).unwrap();
      if (result.success) {
        navigate("/signin");
      }
    } catch (err: any) {
      console.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-gray-800 text-white p-8 rounded-2xl shadow-lg space-y-6"
      >
        <h2 className="text-3xl font-bold text-center">Reset Password</h2>
        <p className="text-center text-gray-400 text-sm">
          Enter your new password below.
        </p>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            {...register("newPassword")}
            placeholder="Enter new password"
            className={`w-full px-4 py-2 rounded-lg bg-gray-700 border ${
              errors.newPassword ? "border-red-500" : "border-gray-600"
            } focus:outline-none focus:ring-2 focus:ring-teal-400`}
          />
          {errors.newPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            {...register("confirmNewPassword")}
            placeholder="Confirm new password"
            className={`w-full px-4 py-2 rounded-lg bg-gray-700 border ${
              errors.confirmNewPassword ? "border-red-500" : "border-gray-600"
            } focus:outline-none focus:ring-2 focus:ring-teal-400`}
          />
          {errors.confirmNewPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmNewPassword.message}</p>
          )}
        </div>

        {/* Backend Error */}
        {error && <div className="text-red-500 text-center">{error}</div>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-medium transition disabled:opacity-50 flex items-center justify-center"
        >
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </button>

        {/* Loading state */}
        {loading && <p className="text-center text-gray-400 mt-2">Processing...</p>}
      </form>
    </div>
  );
};

export default ResetPassword;
