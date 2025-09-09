import React, { useReducer, useEffect } from "react";
import {
  signIn,
  confirmSignIn,
  fetchAuthSession,
  signOut,
  getCurrentUser,
} from "aws-amplify/auth";
import { useUserStore } from '../store/userStore';
import "@aws-amplify/ui-react/styles.css";

interface AuthWithOTPProps {
  children: React.ReactNode;
}

interface AuthFormState {
  identifier: string;
  identifierType: "email" | "phone";
  otp: string;
  step: "identifier" | "otp" | "authenticated";
  loading: boolean;
  error: string;
}

type AuthFormAction =
  | { type: "SET_FIELD"; field: keyof AuthFormState; value: any }
  | { type: "UPDATE_FORM"; updates: Partial<AuthFormState> }
  | { type: "RESET_FORM" }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string }
  | { type: "SEND_OTP_SUCCESS" }
  | { type: "VERIFY_OTP_SUCCESS" };

const initialFormState: AuthFormState = {
  identifier: "",
  identifierType: "email",
  otp: "",
  step: "identifier",
  loading: false,
  error: ""
};

function authFormReducer(state: AuthFormState, action: AuthFormAction): AuthFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "UPDATE_FORM":
      return { ...state, ...action.updates };
    case "RESET_FORM":
      return initialFormState;
    case "SET_LOADING":
      return { ...state, loading: action.loading, error: "" };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };
    case "SEND_OTP_SUCCESS":
      return { ...state, step: "otp", loading: false, error: "" };
    case "VERIFY_OTP_SUCCESS":
      return { ...state, step: "authenticated", loading: false, error: "" };
    default:
      return state;
  }
}

export function AuthWithOTP({ children }: AuthWithOTPProps) {
  const [formState, dispatch] = useReducer(authFormReducer, initialFormState);
  const { user, setUser, setLoading: setUserLoading, clearUser, isAuthenticated } = useUserStore();
  const [initialCheckComplete, setInitialCheckComplete] = React.useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      verifyPersistedAuth();
    } else {
      checkAuthStatus();
    }
  }, []);

  const verifyPersistedAuth = async () => {
    try {
      const session = await fetchAuthSession();
      if (session.tokens) {
        // Session is still valid, update to authenticated state
        dispatch({ type: "VERIFY_OTP_SUCCESS" });
        setInitialCheckComplete(true);
      } else {
        // Session expired, clear user and show login
        clearUser();
        setInitialCheckComplete(true);
      }
    } catch (err) {
      console.log("Session validation failed");
      clearUser();
      setInitialCheckComplete(true);
    }
  };

  const checkAuthStatus = async () => {
    try {
      setUserLoading(true);
      const session = await fetchAuthSession();
      if (session.tokens) {
        const currentUser = await getCurrentUser();
        setUser({
          ...currentUser,
          username:
            session.tokens.idToken?.payload?.email ||
            session.tokens.idToken?.payload?.phone_number,
        } as any);
        dispatch({ type: "VERIFY_OTP_SUCCESS" });
      } else {
        clearUser();
      }
    } catch (err) {
      console.log("Not authenticated");
      clearUser();
    } finally {
      setUserLoading(false);
      setInitialCheckComplete(true);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_LOADING", loading: true });

    try {
      const signInOutput = await signIn({
        username: formState.identifier,
        options: {
          authFlowType: "USER_AUTH",
          preferredChallenge:
            formState.identifierType === "phone" ? "SMS_OTP" : "EMAIL_OTP",
        },
      });

      const expectedStep =
        formState.identifierType === "phone"
          ? "CONFIRM_SIGN_IN_WITH_SMS_CODE"
          : "CONFIRM_SIGN_IN_WITH_EMAIL_CODE";

      if (signInOutput.nextStep?.signInStep === expectedStep) {
        dispatch({ type: "SEND_OTP_SUCCESS" });
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      dispatch({ type: "SET_ERROR", error: err.message || "Error sending OTP" });
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_LOADING", loading: true });

    try {
      const result = await confirmSignIn({
        challengeResponse: formState.otp,
      });

      if (result.isSignedIn) {
        await checkAuthStatus();
        dispatch({ type: "VERIFY_OTP_SUCCESS" });
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      dispatch({ type: "SET_ERROR", error: err.message || "Invalid OTP" });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      clearUser();
      dispatch({ type: "RESET_FORM" });
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Show loading spinner during initial auth check
  if (!initialCheckComplete) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show the app
  if (formState.step === "authenticated" && isAuthenticated && user) {
    return React.cloneElement(children as React.ReactElement, {
      user,
      handleSignOut,
    });
  }

  // Otherwise, show the login form
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-center mb-8 text-2xl font-semibold">
          sign in to bodeEV
        </h1>

        {formState.error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-5">{formState.error}</div>
        )}

        {formState.step === "identifier" && (
          <form onSubmit={handleSendOTP}>
            <div className="mb-5">
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "SET_FIELD", field: "identifierType", value: "email" })}
                  className={`flex-1 p-2.5 border border-gray-300 rounded cursor-pointer transition-all duration-200 ${
                    formState.identifierType === "email"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "SET_FIELD", field: "identifierType", value: "phone" })}
                  className={`flex-1 p-2.5 border border-gray-300 rounded cursor-pointer transition-all duration-200 ${
                    formState.identifierType === "phone"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  Phone
                </button>
              </div>
              <label className="block mb-1.5">
                {formState.identifierType === "email" ? "Email" : "Phone Number"}
              </label>
              <input
                type={formState.identifierType === "email" ? "email" : "tel"}
                value={formState.identifier}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "identifier", value: e.target.value })}
                required
                className="w-full p-2.5 border border-gray-300 rounded text-base"
                placeholder={
                  formState.identifierType === "email"
                    ? "Enter your email"
                    : "+1 (555) 123-4567"
                }
              />
            </div>
            <button
              type="submit"
              disabled={formState.loading}
              className={`w-full py-3 text-white border-none rounded text-base ${
                formState.loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 cursor-pointer hover:bg-blue-700"
              }`}
            >
              {formState.loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {formState.step === "otp" && (
          <form onSubmit={handleVerifyOTP}>
            <p className="mb-5 text-gray-600">
              We've sent a code to {formState.identifier}
            </p>
            <div className="mb-5">
              <label className="block mb-1.5">Enter OTP Code</label>
              <input
                type="text"
                value={formState.otp}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "otp", value: e.target.value })}
                required
                className="w-full p-2.5 border border-gray-300 rounded text-base text-center tracking-widest"
                placeholder="123456"
              />
            </div>
            <button
              type="submit"
              disabled={formState.loading}
              className={`w-full py-3 text-white border-none rounded text-base ${
                formState.loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 cursor-pointer hover:bg-green-700"
              }`}
            >
              {formState.loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "UPDATE_FORM", updates: { step: "identifier", otp: "" } })}
              className="w-full py-3 bg-transparent text-blue-600 border-none text-sm cursor-pointer mt-2.5 hover:text-blue-800"
            >
              Back to email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}