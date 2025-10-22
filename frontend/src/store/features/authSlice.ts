import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// ------------------- Types -------------------
interface User {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
  memberships: Array<{
    role: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      
    };
  }>;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  needsVerification: boolean;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  organizationName: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface VerifyOtpData {
  email: string;
  otp: string;
}

// Generic API Response type
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

// ------------------- Initial State -------------------
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  needsVerification: false,
};

// ------------------- API Base URL -------------------
const API_BASE_URL = "http://localhost:3000/api/auth";

// ------------------- AsyncThunks -------------------

// 🎯 SIGNUP: Backend returns ApiResponse<User> (direct User object)
export const doSignup = createAsyncThunk<
  ApiResponse<User>,  // ← Return type: data contains User directly
  SignupData,         // ← Argument type
  { rejectValue: string }
>(
  "auth/doSignup",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data: ApiResponse<User> = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Signup failed");
      }

      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Network Error");
    }
  }
);

// 🎯 LOGIN: Backend returns ApiResponse<{user: User}> (wrapped in user object)
export const doLogin = createAsyncThunk<
  ApiResponse<{ user: User }>,  // ← Return type: data contains {user: User}
  LoginData,                   // ← Argument type
  { rejectValue: string }
>(
  "auth/doLogin",
  async (loginData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data: ApiResponse<{ user: User }> = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Login Failed");
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Login Failed");
    }
  }
);

//  VERIFY OTP: Backend returns ApiResponse<User> (direct User object)
export const verifyOtp = createAsyncThunk<
  ApiResponse<User>,  // ← Return type: data contains User directly
  VerifyOtpData,      // ← Argument type
  { rejectValue: string }
>(
  "auth/verifyOtp",
  async (verifyData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verifyData),
      });

      const data: ApiResponse<User> = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "OTP Verification Failed");
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "OTP Verification Failed");
    }
  }
);

// 🎯 LOGOUT: Backend returns ApiResponse (no data)
export const doLogout = createAsyncThunk<
  ApiResponse,  // ← Return type: no data field needed
  void,         // ← No arguments
  { rejectValue: string }
>(
  "auth/doLogout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Logout Failed");
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Logout Failed");
    }
  }
);

// ------------------- Slice -------------------
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state:AuthState) => {
      state.error = null;
    },
    resetAuth: (state:AuthState) => {
      state.user = null;
      state.isAuthenticated = false;
      state.needsVerification = false;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      //  SIGNUP CASES
      .addCase(doSignup.pending, (state:AuthState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(doSignup.fulfilled, (state:AuthState, action:PayloadAction<string>) => {
        state.loading = false;
        //  action.payload.data is User directly
        state.user = action.payload.data || null;
        state.needsVerification = true;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(doSignup.rejected, (state:AuthState, action:PayloadAction<string>) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.needsVerification = false;
        state.error = action.payload || "Signup failed";
      })
      
      //  LOGIN CASES
      .addCase(doLogin.pending, (state:AuthState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(doLogin.fulfilled, (state:AuthState, action:PayloadAction<string>) => {
        console.log('data in login action' , action.payload.data)
        state.loading = false;
        state.user = action.payload.data?.user || null;
        state.isAuthenticated = true;
        state.needsVerification = false;
        state.error = null;
      })
      .addCase(doLogin.rejected, (state:AuthState, action:PayloadAction<string>) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload || "Login failed";
      })
      
      //  VERIFY OTP CASES
      .addCase(verifyOtp.pending, (state:AuthState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state:AuthState, action:PayloadAction<string>) => {
        state.loading = false;
        console.log("data in verify otp action" , action.payload)
        state.user = action.payload.data || null;
        state.isAuthenticated = true;
        state.needsVerification = false;
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state:AuthState, action:PayloadAction<string>) => {
        state.loading = false;
        state.error = action.payload || "OTP verification failed";
      })
      
      //  LOGOUT CASES
      .addCase(doLogout.pending, (state:AuthState) => {
        state.loading = true;
      })
      .addCase(doLogout.fulfilled, (state:AuthState) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.needsVerification = false;
        state.error = null;
      })
      .addCase(doLogout.rejected, (state:AuthState, action:PayloadAction<string>) => {
        state.loading = false;
        state.error = action.payload || "Logout failed";
      });
  },
});

export const { clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;