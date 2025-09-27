import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

// ------------------- Types -------------------
interface User {
  username: string;
  email: string;
  orgname: string;
}

interface AuthState {
  user: User | null;
  authStatus: "idle" | "loading" | "succeeded" | "failed";
  loading: boolean;
  error: string | null;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  orgname: string;
}

interface SignupResponse {
  user: User;
  token: string; 
}

// ------------------- Initial State -------------------
const initialState: AuthState = {
  user: null,
  authStatus: "idle",
  loading: false,
  error: null,
};

// ------------------- AsyncThunk -------------------
export const doSignup = createAsyncThunk<
  SignupResponse, // returned value type
  SignupData,     // argument type
  { rejectValue: string } // rejected value type
>(
  "auth/doSignup",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Signup failed");
      }

      const data: SignupResponse = await response.json();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Network Error");
    }
  }
);

// ------------------- Slice -------------------
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.authStatus = "idle";
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.authStatus = "succeeded";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(doSignup.pending, (state) => {
        state.loading = true;
        state.authStatus = "loading";
        state.error = null;
      })
      .addCase(doSignup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.authStatus = "succeeded";
        state.error = null;
        // optionally, store token in localStorage
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(doSignup.rejected, (state, action) => {
        state.loading = false;
        state.authStatus = "failed";
        state.error = action.payload || "Signup failed";
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
