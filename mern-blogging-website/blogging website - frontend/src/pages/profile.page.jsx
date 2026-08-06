import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { UserContext } from "../App";
import { filterPaginationData } from "../common/filter-pagination-data";
import InPageNavigation from "../components/inpage-navigation.component";
import AboutUser from "../components/about.component";
import PageNotFound from "./404.page";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";

export const profileDataStructure = {
  personal_info: {
    fullname: "",
    username: "",
    profile_img: "",
    bio: "",
  },
  account_info: {
    total_posts: 0,
    total_blogs: 0,
  },
  social_links: {},
  joinedAt: "",
};

const ProfilePage = () => {
  let { id: profileID } = useParams();
  let [profile, setProfile] = useState(profileDataStructure);
  let [loading, setLoading] = useState(true);
  let [blogs, setBlogs] = useState(null);
  let [profileLoaded, setProfileLoaded] = useState("");

  let {
    personal_info: { fullname, username: profile_username, profile_img, bio },
    account_info: { total_posts, total_reads },
    social_links,
    joinedAt,
  } = profile;

  let {
    userAuth: { username },
  } = useContext(UserContext);

  const fetchUserProfile = async () => {
    try {
      const { data: user } = await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/user/get-profile",
        { username: profileID },
      );
      if (user !== null) {
        setProfile(user);
        setProfileLoaded(profileID);
        getBlogs({ user_id: user._id });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileID !== profileLoaded) {
      setBlogs(null);
    }
    if (blogs === null) {
      resetStates();
      fetchUserProfile();
    }
  }, [profileID, blogs]);

  const getBlogs = async ({ page = 1, user_id }) => {
    user_id = user_id === undefined ? blogs?.user_id : user_id;
    try {
      const { data } = await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/blog/search-blogs",
        { author: user_id, page },
      );
      let formatedData = await filterPaginationData({
        state: blogs,
        data: data.blogs,
        page,
        countRoute: "/blog/search-blogs-count",
        data_to_send: { author: user_id },
      });
      formatedData.user_id = user_id;
      setBlogs(formatedData);
    } catch (err) {
      console.error("Failed to fetch blogs:", err);
    }
  };

  const resetStates = () => {
    setProfile(profileDataStructure);
    setProfileLoaded("");
    setLoading(true);
  };
  return (
    <>
      <AnimationWrapper>
        {loading ? (
          <Loader />
        ) : profile_username.length ? (
          <section className="h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap-12">
            <div className="flex flex-col max-md:items-center gap-5 min-w-[250px] md:w-[50%] md:pl-8 md:border-1 border-grey md:sticky md:top-[100px] md:py-10">
              <img
                src={profile_img}
                alt="profile image"
                className="w-48 h-48 bg-grey rounded-full md:w-32 md:h-32"
              />

              <h1 className="text-2xl font-medium">@{profile_username}</h1>
              <p className="text-xl capitalize h-6">{fullname}</p>
              <p>
                {total_posts.toLocaleString()} Blogs -{" "}
                {total_reads.toLocaleString()} Reads
              </p>

              <div className="flex gap-4 mt-2">
                {profileID == username ? (
                  <Link
                    to="/settings/edit-profile"
                    className="btn-light rounded-md">
                    Edit Profile
                  </Link>
                ) : (
                  ""
                )}
              </div>

              <AboutUser
                className="max-md:hidden"
                bio={bio}
                social_links={social_links}
                joinedAt={joinedAt}
              />
            </div>

            <div className="max-md:mt-12 w-full ">
              <InPageNavigation
                routes={["Blogs Published", "About"]}
                defaultHidden={["About"]}>
                {/* Home Feed Context */}
                <>
                  {blogs == null ? (
                    <Loader />
                  ) : blogs.results?.length ? (
                    blogs.results.map((blog, i) => {
                      return (
                        <AnimationWrapper
                          transition={{ duration: 1, delay: i * 0.1 }}
                          key={i}>
                          <BlogPostCard
                            content={blog}
                            author={blog.author.personal_info}></BlogPostCard>
                        </AnimationWrapper>
                      );
                    })
                  ) : (
                    <NoDataMessage message="No blogs published" />
                  )}

                  <LoadMoreDataBtn state={blogs} fetchDataFun={getBlogs} />
                </>

                <AboutUser
                  bio={bio}
                  social_links={social_links}
                  joinedAt={joinedAt}
                />
              </InPageNavigation>
            </div>
          </section>
        ) : (
          <PageNotFound />
        )}
      </AnimationWrapper>
    </>
  );
};

export default ProfilePage;
