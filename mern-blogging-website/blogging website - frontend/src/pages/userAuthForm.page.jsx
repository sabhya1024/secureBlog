import InputBox from "../components/input.component";
import React, { useContext, useState } from "react";
import googleIcon from "../imgs/google.png";
import { Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { toast, Toaster } from "react-hot-toast";
import api from "../common/api";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { Navigate } from "react-router-dom";
import { authwithGoogle } from "../common/firebase";

let emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])\S{8,20}$/;

const UserAuthForm = ({ type }) => {
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  let {
    userAuth: { access_token },
    setUserAuth,
  } = useContext(UserContext);

  const userAuthThroughServer = async (endpoint, formData) => {
    try {
      const { data } = await api.post(
        import.meta.env.VITE_BACKEND_URL + endpoint,
        formData,
        { withCredentials: true },
      );

      if (data?.requireVerification) {
        setVerificationRequired(true);
        setRegisteredEmail(data.email || formData.email);
        toast.success(data.message || "Please verify your email.");
        return;
      }

      storeInSession("user", data);
      setUserAuth(data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Something went wrong");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let endpoint = type === "signin" ? "/auth/signin" : "/auth/signup";

    //formData
    let form = new FormData(e.target);
    let formData = {};

    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }

    //validaton

    let { fullname, email, password } = formData;

    if (type !== "signin") {
      if (!fullname || fullname.length < 3) {
        return toast.error("Fullname must be atleast 3 letters long");
      }
    }

    if (!email) {
      return toast.error("Email can not be empty.");
    }

    if (!emailRegex.test(email)) {
      return toast.error("Enter a valid email address.");
    }

    if (!password || !passwordRegex.test(password)) {
      return toast.error(
        "Password should be 8 to 20 characters long with atleast a numeric, 1 special symbol, 1 lowercase and 1 uppercase letters",
      );
    }

    userAuthThroughServer(endpoint, formData);
  };

  const handleGoogleAuth = async (e) => {
    e.preventDefault();
    try {
      const user = await authwithGoogle();

      if (user) {
        const token = await user.getIdToken();

        let endpoint = "/auth/google-auth";
        let formData = {
          access_token: token,
        };

        userAuthThroughServer(endpoint, formData);
      }
    } catch (err) {
      toast.error("Trouble logging in with Google");
      console.log(err);
    }
  };

  return (
    <>
      {access_token ? (
        <Navigate to="/" />
      ) : (
        <AnimationWrapper keyValue={type}>
          <section className="h-cover flex items-center justify-center">
            <Toaster />
            {verificationRequired ? (
              <div className="w-[85%] max-w-[420px] bg-grey p-8 rounded-xl text-center">
                <i className="fi fi-rr-envelope-check text-5xl text-emerald-500 block mb-4"></i>
                <h1 className="text-3xl font-gelasio capitalize text-center mb-3">
                  Check your email
                </h1>
                <p className="text-dark-grey text-sm mb-4 leading-relaxed">
                  We've sent a verification link to <strong className="text-black">{registeredEmail}</strong>.
                </p>
                <p className="text-dark-grey text-xs mb-6">
                  Please click the link in your email to verify account ownership. Once verified, you can sign in and start uploading blogs immediately!
                </p>
                <Link to="/signin" className="btn-dark center block w-full">
                  Go to Sign In
                </Link>
              </div>
            ) : (
              <form
                id="formElement"
                onSubmit={handleSubmit}
                className="w-[80%] max-w-[400px]">
                <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
                  {type === "signin" ? "Welcome back " : "Create new Account. "}
                </h1>

              {type !== "signin" ? (
                <InputBox
                  name="fullname"
                  type="text"
                  placeholder="fullname"
                  icon="fi-rr-user "
                />
              ) : (
                ""
              )}

              <InputBox
                name="email"
                type="email"
                placeholder="Enter the email"
                icon="fi-sr-envelope "
              />

              <InputBox
                name="password"
                type="password"
                placeholder="Enter the password"
                icon="fi-rr-key "
              />

              {type === "signin" && (
                <div className="text-right -mt-2 mb-4">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-dark-grey underline hover:text-black">
                    Forgot password?
                  </Link>
                </div>
              )}

              <button className="btn-dark center mt-14 " type="submit">
                {type.replace("-", " ")}
              </button>

              <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
                <hr className="w-1/2 border-black" />
                <p>or</p>
                <hr className="w-1/2 border-black" />
              </div>
              <button
                className="btn-dark  flex items-center justify-center gap-4 w-[90%] center"
                type="button"
                onClick={handleGoogleAuth}>
                <img src={googleIcon} className="w-5" />
                Continue with Google
              </button>

              {type === "signin" ? (
                <p className="mt-6 text-dark-grey text-xl text-center">
                  Don't have an account ?
                  <Link
                    to="/signup"
                    className="underline text-black text-xl ml-1">
                    Join us today
                  </Link>
                </p>
              ) : (
                <p className="mt-6 text-dark-grey text-xl text-center">
                  Already have an account ?
                  <Link
                    to="/signin"
                    className="underline text-black text-xl ml-1">
                    Signin now
                  </Link>
                </p>
              )}
            </form>
          )}
          </section>
        </AnimationWrapper>
      )}
    </>
  );
};

export default UserAuthForm;
