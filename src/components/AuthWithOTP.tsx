import React, { useState, useEffect } from "react";
import {
  signIn,
  confirmSignIn,
  fetchAuthSession,
  signOut,
  type SignInOutput,
} from "aws-amplify/auth";
import "@aws-amplify/ui-react/styles.css";

interface AuthWithOTPProps {
  children: React.ReactNode;
}

export function AuthWithOTP({ children }: AuthWithOTPProps) {
  const [identifier, setIdentifier] = useState("");
  const [identifierType, setIdentifierType] = useState<"email" | "phone">(
    "email"
  );
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"identifier" | "otp" | "authenticated">(
    "identifier"
  );
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const session = await fetchAuthSession();
      if (session.tokens) {
        setStep("authenticated");
        setUser({
          username:
            session.tokens.idToken?.payload?.email ||
            session.tokens.idToken?.payload?.phone_number,
        });
      }
    } catch (err) {
      console.log("Not authenticated");
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("(debig) identifier:", identifier);
      console.log("(debig) identifierType:", identifierType);

      const signInOutput = await signIn({
        username: identifier,
        options: {
          authFlowType: "USER_AUTH",
          preferredChallenge:
            identifierType === "phone" ? "SMS_OTP" : "EMAIL_OTP",
        },
      });

      const expectedStep =
        identifierType === "phone"
          ? "CONFIRM_SIGN_IN_WITH_SMS_CODE"
          : "CONFIRM_SIGN_IN_WITH_EMAIL_CODE";

      if (signInOutput.nextStep?.signInStep === expectedStep) {
        setStep("otp");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await confirmSignIn({
        challengeResponse: otp,
      });

      if (result.isSignedIn) {
        setStep("authenticated");
        checkAuthStatus();
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setStep("identifier");
      setUser(null);
      setIdentifier("");
      setOtp("");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  if (step === "authenticated" && user) {
    return React.cloneElement(children as React.ReactElement, {
      user,
      handleSignOut,
    });
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-center mb-8 text-2xl font-semibold">
          sign in to bodeEV
        </h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-5">{error}</div>
        )}

        {step === "identifier" && (
          <form onSubmit={handleSendOTP}>
            <div className="mb-5">
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setIdentifierType("email")}
                  className={`flex-1 p-2.5 border border-gray-300 rounded cursor-pointer transition-all duration-200 ${
                    identifierType === "email"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setIdentifierType("phone")}
                  className={`flex-1 p-2.5 border border-gray-300 rounded cursor-pointer transition-all duration-200 ${
                    identifierType === "phone"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  Phone
                </button>
              </div>
              <label className="block mb-1.5">
                {identifierType === "email" ? "Email" : "Phone Number"}
              </label>
              <input
                type={identifierType === "email" ? "email" : "tel"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full p-2.5 border border-gray-300 rounded text-base"
                placeholder={
                  identifierType === "email"
                    ? "Enter your email"
                    : "+1 (555) 123-4567"
                }
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white border-none rounded text-base ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 cursor-pointer hover:bg-blue-700"
              }`}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOTP}>
            <p className="mb-5 text-gray-600">
              We've sent a code to {identifier}
            </p>
            <div className="mb-5">
              <label className="block mb-1.5">Enter OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full p-2.5 border border-gray-300 rounded text-base text-center tracking-widest"
                placeholder="123456"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white border-none rounded text-base ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 cursor-pointer hover:bg-green-700"
              }`}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("identifier");
                setOtp("");
              }}
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
