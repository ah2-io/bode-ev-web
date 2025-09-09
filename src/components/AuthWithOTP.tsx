import React, { useReducer, useEffect } from "react";
import {
  signIn,
  confirmSignIn,
  fetchAuthSession,
  signOut,
  getCurrentUser,
} from "aws-amplify/auth";
import { Button, Input } from '@headlessui/react';
import { useUserStore } from '../store/userStore';
import Header from './Header';
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
      <div className="w-full min-h-screen flex flex-col">
        <Header />
        <div className="flex justify-center items-center flex-1 pt-20 animate-[zoomOut_0.3s_ease-out_forwards]">
          <div className="bg-white rounded-full p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (formState.step === "authenticated" && isAuthenticated && user) {
    return (
      <div className="w-full min-h-screen flex flex-col">
        <Header user={user} onSignOut={handleSignOut} />
        {React.cloneElement(children as React.ReactElement, {
          user,
          handleSignOut,
        })}
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col">
      <Header />
      <div className="flex justify-center items-center flex-1 pt-20">
        <div className="bg-gradient-to-r from-white to-white/60 backdrop-blur-md p-14 py-16 rounded-r-[3rem] w-full max-w-md animate-fade-in transition-[height] duration-300 ease-out">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">
          SIGN IN TO ADMIN PORTAL
        </h1>

        {formState.error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-5">{formState.error}</div>
        )}

        {formState.step === "identifier" && (
          <form onSubmit={handleSendOTP}>
            <div className="mb-5">
              <div className="flex gap-3 mb-4">
                <Button
                  type="button"
                  onClick={() => dispatch({ type: "SET_FIELD", field: "identifierType", value: "email" })}
                  className={`flex-1 px-3 py-1.5 border border-gray-300 cursor-pointer transition-all duration-200 text-sm ${
                    formState.identifierType === "email"
                      ? "bg-secondary text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  Email
                </Button>
                <Button
                  type="button"
                  onClick={() => dispatch({ type: "SET_FIELD", field: "identifierType", value: "phone" })}
                  className={`flex-1 px-3 py-1.5 border border-gray-300 cursor-pointer transition-all duration-200 text-sm ${
                    formState.identifierType === "phone"
                      ? "bg-secondary text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  Phone
                </Button>
              </div>
              <Input
                type={formState.identifierType === "email" ? "email" : "tel"}
                value={formState.identifier}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "identifier", value: e.target.value })}
                required
                className="w-full p-2.5 border border-gray-300 text-base"
                placeholder={
                  formState.identifierType === "email"
                    ? "Enter your email"
                    : "+1 (555) 123-4567"
                }
              />
            </div>
            <Button
              type="submit"
              disabled={formState.loading}
              className={`w-full py-3 text-white border-none text-base ${
                formState.loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary cursor-pointer hover:bg-primary-hover"
              }`}
            >
              {formState.loading ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        )}

        {formState.step === "otp" && (
          <form onSubmit={handleVerifyOTP}>
            <p className="mb-5 text-gray-600">
              We've sent a code to {formState.identifier}
            </p>
            <div className="mb-5">
              <Input
                type="text"
                value={formState.otp}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "otp", value: e.target.value })}
                required
                className="w-full p-2.5 border border-gray-300 text-base text-center tracking-widest"
                placeholder="123456"
              />
            </div>
            <Button
              type="submit"
              disabled={formState.loading}
              className={`w-full py-3 text-white border-none text-base ${
                formState.loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary cursor-pointer hover:bg-primary-hover"
              }`}
            >
              {formState.loading ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button
              type="button"
              onClick={() => dispatch({ type: "UPDATE_FORM", updates: { step: "identifier", otp: "" } })}
              className="w-full py-3 bg-transparent text-primary border-none text-sm cursor-pointer mt-2.5 hover:text-primary-hover"
            >
              Back to email
            </Button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}