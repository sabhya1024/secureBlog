import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../App";
import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import InputBox from "../components/input.component";
import { toast, Toaster } from "react-hot-toast";
import { storeInSession } from "../common/session";

const profileStructure = {
  personal_info: {
    fullname: "",
    username: "",
    profile_img: "",
    email: "",
    bio: "",
  },
  social_links: {
    youtube: "",
    instagram: "",
    facebook: "",
    github: "",
    website: "",
  },
};

const EditProfile = () => {
  const {
    userAuth,
    userAuth: { access_token },
    setUserAuth,
  } = useContext(UserContext);

  const [profile, setProfile] = useState(profileStructure);
  const [loading, setLoading] = useState(true);
  const [charactersLeft, setCharactersLeft] = useState(250);
  const [updatedProfileImg, setUpdatedProfileImg] = useState(null);

  const profileImgEle = useRef();
  const editProfileForm = useRef();

  const {
    personal_info: {
      fullname,
      username: profile_username,
      profile_img,
      email,
      bio,
    },
    social_links,
  } = profile;

  useEffect(() => {
    if (access_token) {
      const getProfileData = async () => {
        try {
          const { data } = await axios.post(
            import.meta.env.VITE_BACKEND_URL + "/user/get-profile",
            {
              username: userAuth.user?.username || userAuth.username,
            },
          );
          setProfile(data);
          setCharactersLeft(250 - (data.personal_info?.bio?.length || 0));
          setLoading(false);
        } catch (err) {
          console.error(err);
          setLoading(false);
        }
      };

      getProfileData();
    }
  }, [access_token]);

  const handleCharacterChange = (e) => {
    setCharactersLeft(250 - e.target.value.length);
  };

  const handleImagePreview = (e) => {
    let img = e.target.files[0];
    if (img) {
      profileImgEle.current.src = URL.createObjectURL(img);
      setUpdatedProfileImg(img);
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();

    if (!updatedProfileImg) {
      return toast.error("Select an image first to upload");
    }

    let loadingToast = toast.loading("Uploading image...");
    e.target.setAttribute("disabled", true);

    const formData = new FormData();
    formData.append("file", updatedProfileImg);

    try {
      const {
        data: { secure_url },
      } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/upload/image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const { data } = await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/user/update-profile-img",
        { url: secure_url },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      let newUserAuth = { ...userAuth, profile_img: data.profile_img };
      storeInSession("user", JSON.stringify(newUserAuth));
      setUserAuth(newUserAuth);

      setUpdatedProfileImg(null);
      toast.dismiss(loadingToast);
      e.target.removeAttribute("disabled");
      toast.success("Profile image updated!");
    } catch (err) {
      toast.dismiss(loadingToast);
      e.target.removeAttribute("disabled");
      toast.error(err.response?.data?.error || "Failed to upload image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let form = new FormData(editProfileForm.current);
    let formData = {};

    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }

    let { username, bio, youtube, facebook, instagram, github, website } =
      formData;

    if (username.length < 3) {
      return toast.error("Username should be at least 3 letters long");
    }

    if (bio.length > 250) {
      return toast.error("Bio should not be more than 250 characters");
    }

    let loadingToast = toast.loading("Updating...");
    e.target.setAttribute("disabled", true);

    try {
      const { data } = await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/user/update-profile",
        {
          username,
          bio,
          social_links: { youtube, facebook, instagram, github, website },
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      if (userAuth.username !== data.username) {
        let newUserAuth = { ...userAuth, username: data.username };
        storeInSession("user", newUserAuth);
        setUserAuth(newUserAuth);
      }

      toast.dismiss(loadingToast);
      e.target.removeAttribute("disabled");
      toast.success("Profile Updated");
    } catch (err) {
      toast.dismiss(loadingToast);
      e.target.removeAttribute("disabled");
      toast.error(err.response?.data?.error || "Error updating profile");
    }
  };

  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <form ref={editProfileForm}>
          <Toaster />

          <h1 className="max-md:hidden">Edit Profile</h1>

          <div className="flex flex-col lg:flex-row items-start py-10 gap-8 lg:gap-10">
            <div className="max-lg:center mb-5 font-bold">
              <label
                htmlFor="uploadImg"
                id="profileImgLable"
                className="relative block w-48 h-48 bg-grey rounded-full overflow-hidden cursor-pointer">
                <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-white bg-black/60 opacity-0 hover:opacity-100 duration-300">
                  Upload Image
                </div>

                <img ref={profileImgEle} src={profile_img} alt="Profile" />
              </label>

              <input
                type="file"
                id="uploadImg"
                accept=".jpeg, .png, .jpg"
                hidden
                onChange={handleImagePreview}
              />

              <button
                className="btn-light mt-5 max-lg:center lg:w-full"
                onClick={handleImageUpload}>
                Upload
              </button>
            </div>

            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5">
                <div>
                  <InputBox
                    name="fullname"
                    type="text"
                    value={fullname}
                    placeholder="Full Name"
                    disable={true}
                    icon="fi-rr-user"
                  />
                </div>

                <div>
                  <InputBox
                    name="email"
                    type="email"
                    value={email}
                    placeholder="Email"
                    disable={true}
                    icon="fi-sr-envelope"
                  />
                </div>
              </div>

              <InputBox
                type="text"
                name="username"
                value={profile_username}
                placeholder="Username"
                icon="fi-rr-at"
              />

              <p className="text-dark-grey -mt-3 text-sm">
                Username will be used to search user and will be visible to all
                users
              </p>

              <textarea
                name="bio"
                maxLength="250"
                defaultValue={bio}
                className="input-box h-64 lg:h-40 resize-none leading-7 mt-5 pl-5"
                placeholder="Bio"
                onChange={handleCharacterChange}></textarea>

              <p className="mt-1 text-dark-grey text-sm text-right">
                {charactersLeft} characters left
              </p>

              <p className="my-6 text-dark-grey">
                Add your social handles below
              </p>

              <div className="md:grid md:grid-cols-2 gap-x-6">
                {Object.keys(social_links).map((key, i) => {
                  let link = social_links[key];
                  return (
                    <InputBox
                      key={i}
                      name={key}
                      type="text"
                      value={link}
                      placeholder="https://"
                      icon={
                        "fi " +
                        (key !== "website" ? "fi-brands-" + key : "fi-rr-globe")
                      }
                    />
                  );
                })}
              </div>

              <button
                className="btn-dark w-[100%] max-lg:center font-medium mt-14"
                type="submit"
                onClick={handleSubmit}>
                Update
              </button>
            </div>
          </div>
        </form>
      )}
    </AnimationWrapper>
  );
};

export default EditProfile;
