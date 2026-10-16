import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { toast, Toaster } from "react-hot-toast";
import api from "../common/api";

const VerifyEmail = () => {
  const [status, setStatus] = useState("verifying"); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided in the link.");
      return;
    }

    const verify = async () => {
      try {
        const { data } = await api.post(
          import.meta.env.VITE_BACKEND_URL + "/auth/verify-email",
          { token }
        );
        setStatus("success");
        setMessage(
          data.message ||
            "Your email has been verified successfully! You can now log in and start uploading blogs."
        );
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.error ||
            "Verification failed. The link may have expired or is invalid."
        );
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) {
      return toast.error("Please enter your email");
    }

    setResendLoading(true);
    try {
      const { data } = await api.post(
        import.meta.env.VITE_BACKEND_URL + "/auth/resend-verification",
        { email: resendEmail }
      );
      toast.success(data.message || "New verification link sent to your email!");
      setResendEmail("");
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to resend verification email."
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AnimationWrapper>
      <section className="h-cover flex items-center justify-center">
        <Toaster />
        <div className="w-[85%] max-w-[440px]">
          {status === "verifying" && (
            <div className="bg-grey p-8 rounded-xl text-center">
              <i className="fi fi-rr-spinner animate-spin text-5xl text-dark-grey block mb-4"></i>
              <h2 className="text-2xl font-gelasio capitalize mb-2">
                Verifying your email...
              </h2>
              <p className="text-dark-grey text-sm">
                Please wait a moment while we confirm your account ownership.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="bg-grey p-8 rounded-xl text-center">
              <i className="fi fi-rr-check-circle text-5xl text-emerald-500 block mb-4"></i>
              <h2 className="text-2xl font-gelasio capitalize mb-2 text-black">
                Email Verified!
              </h2>
              <p className="text-dark-grey text-sm mb-6 leading-relaxed">
                {message}
              </p>
              <Link to="/signin" className="btn-dark center w-full block">
                Sign In & Start Blogging
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="bg-grey p-8 rounded-xl text-center">
              <i className="fi fi-rr-cross-circle text-5xl text-red block mb-4"></i>
              <h2 className="text-2xl font-gelasio capitalize mb-2">
                Verification Failed
              </h2>
              <p className="text-dark-grey text-sm mb-6 leading-relaxed">
                {message}
              </p>

              <form onSubmit={handleResend} className="mt-4 text-left">
                <label className="text-xs text-dark-grey block mb-1">
                  Resend verification email:
                </label>
                <div className="relative w-full mb-3">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="input-box"
                    required
                  />
                  <i className="fi fi-sr-envelope input-icon"></i>
                </div>
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="btn-dark center w-full mb-4"
                >
                  {resendLoading ? "Sending..." : "Resend Verification Link"}
                </button>
              </form>

              <Link to="/signin" className="underline text-dark-grey text-sm">
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default VerifyEmail;
