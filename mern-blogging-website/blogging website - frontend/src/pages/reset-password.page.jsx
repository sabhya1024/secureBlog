import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { toast, Toaster } from "react-hot-toast";
import api from "../common/api";

let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])\S{8,20}$/;

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      return toast.error("Invalid or missing reset token.");
    }

    if (!password) {
      return toast.error("Please enter a new password.");
    }

    if (!passwordRegex.test(password)) {
      return toast.error(
        "Password should be 8 to 20 characters long with at least 1 numeric, 1 lowercase, 1 uppercase, and 1 special symbol."
      );
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    setLoading(true);
    try {
      const { data } = await api.post(
        import.meta.env.VITE_BACKEND_URL + "/auth/reset-password",
        {
          token,
          newPassword: password,
        }
      );
      toast.success(data.message || "Password updated successfully!");
      setTimeout(() => {
        navigate("/signin");
      }, 1500);
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to reset password. Link may be expired."
      );
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
            Create New Password
          </h1>

          {!token ? (
            <div className="bg-grey p-6 rounded-md text-center">
              <i className="fi fi-rr-cross-circle text-4xl text-red block mb-3"></i>
              <p className="text-dark-grey font-medium">
                Invalid or missing password reset token.
              </p>
              <Link to="/forgot-password" className="btn-dark center mt-6 block">
                Request New Reset Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="relative w-full mb-4">
                <input
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  value={password}
                  placeholder="New password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-box"
                  required
                />
                <i className="fi fi-rr-key input-icon"></i>
                <i
                  className={
                    "fi fi-rr-eye" +
                    (!passwordVisible ? "-crossed" : "") +
                    " input-icon left-[auto] right-4 cursor-pointer"
                  }
                  onClick={() => setPasswordVisible((v) => !v)}
                ></i>
              </div>

              <div className="relative w-full mb-4">
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  name="confirmPassword"
                  value={confirmPassword}
                  placeholder="Confirm new password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-box"
                  required
                />
                <i className="fi fi-rr-key input-icon"></i>
                <i
                  className={
                    "fi fi-rr-eye" +
                    (!confirmPasswordVisible ? "-crossed" : "") +
                    " input-icon left-[auto] right-4 cursor-pointer"
                  }
                  onClick={() => setConfirmPasswordVisible((v) => !v)}
                ></i>
              </div>

              <button
                className="btn-dark center mt-6 w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Updating..." : "Save New Password"}
              </button>

              <p className="mt-6 text-dark-grey text-center">
                Back to{" "}
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

export default ResetPassword;
