import InputBox from "../components/input.component";
import React, { useContext } from "react";
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
          </section>
        </AnimationWrapper>
      )}
    </>
  );
};

export default UserAuthForm;
