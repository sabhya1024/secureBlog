import { useRef, useContext } from "react";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import { toast, Toaster } from "react-hot-toast";
import api from "../common/api";
import { UserContext } from "../App";

const ChangePassword = () => {
  const {
    userAuth: { access_token },
  } = useContext(UserContext);

  const changePasswordForm = useRef();
  const passwordRegex =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])\S{8,20}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(changePasswordForm.current);
    const formData = {};

    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }

    const { currentPassword, newPassword, confirmPassword } = formData;

    // Check if any field is empty
    if (
      !currentPassword?.length ||
      !newPassword?.length ||
      !confirmPassword?.length
    ) {
      return toast.error("Fill all the inputs");
    }

    // Validate password pattern
    if (
      !passwordRegex.test(currentPassword) ||
      !passwordRegex.test(newPassword)
    ) {
      return toast.error(
        "Password should be 8 to 20 characters long with at least 1 numeric, 1 lowercase, 1 uppercase, and 1 special symbol",
      );
    }

    // Make sure new password and confirm password match
    if (newPassword !== confirmPassword) {
      return toast.error("New password and confirm password do not match");
    }

    const submitBtn = e.target;
    submitBtn.setAttribute("disabled", true);
    const loadingToast = toast.loading("Updating password...");

    try {
      await api.post(
        import.meta.env.VITE_BACKEND_URL + "/auth/change-password",
        formData,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      toast.dismiss(loadingToast);
      submitBtn.removeAttribute("disabled");
      toast.success("Password Updated Successfully");
    } catch (err) {
      toast.dismiss(loadingToast);
      submitBtn.removeAttribute("disabled");
      toast.error(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <AnimationWrapper>
      <Toaster />
      <form ref={changePasswordForm}>
        <h1 className="max-md:hidden">Change Password</h1>

        <div className="py-10 w-full md:max-w-[400px]">
          <InputBox
            name="currentPassword"
            type="password"
            className="profile-edit-input"
            placeholder="Current Password"
            icon="fi-rr-unlock"
          />

          <InputBox
            name="newPassword"
            type="password"
            className="profile-edit-input"
            placeholder="New Password"
            icon="fi-rr-unlock"
          />

          <InputBox
            name="confirmPassword"
            type="password"
            className="profile-edit-input"
            placeholder="Confirm New Password"
            icon="fi-rr-unlock"
          />

          <button
            onClick={handleSubmit}
            className="btn-dark px-10"
            type="submit">
            Change Password
          </button>
        </div>
      </form>
    </AnimationWrapper>
  );
};

export default ChangePassword;
