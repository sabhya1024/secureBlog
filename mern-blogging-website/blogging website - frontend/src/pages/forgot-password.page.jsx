import { useState } from "react";
import InputBox from "../components/input.component";
import { Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { toast, Toaster } from "react-hot-toast";
import api from "../common/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      return toast.error("Please enter your email address");
    }

    setLoading(true);
    try {
      const { data } = await api.post(
        import.meta.env.VITE_BACKEND_URL + "/auth/forgot-password",
        { email }
      );
      setSubmitted(true);
      toast.success(data.message || "Reset link sent!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimationWrapper>
      <section className="h-cover flex items-center justify-center">
        <Toaster />
        <div className="w-[80%] max-w-[400px]">
          <h1 className="text-4xl font-gelasio capitalize text-center mb-8">
            Reset Password
          </h1>
          <p className="text-dark-grey text-center mb-8">
            Enter your email and we'll send you a link to reset your password.
          </p>

          {submitted ? (
            <div className="bg-grey p-6 rounded-md text-center">
              <i className="fi fi-rr-envelope-check text-4xl text-black block mb-3"></i>
              <p className="text-dark-grey font-medium">
                If an account exists for <strong className="text-black">{email}</strong>, a password reset link has been sent.
              </p>
              <p className="text-sm text-dark-grey mt-4">
                Please check your inbox (and spam folder) for further instructions.
              </p>
              <Link to="/signin" className="btn-dark center mt-6 block">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="relative w-full mb-4">
                <input
                  type="email"
                  name="email"
                  value={email}
                  placeholder="Enter your registered email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-box"
                  required
                />
                <i className="fi fi-sr-envelope input-icon"></i>
              </div>

              <button
                className="btn-dark center mt-6 w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>

              <p className="mt-6 text-dark-grey text-center">
                Remember your password?{" "}
                <Link to="/signin" className="underline text-black ml-1">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default ForgotPassword;
