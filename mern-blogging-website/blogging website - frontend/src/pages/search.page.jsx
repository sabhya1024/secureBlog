import { useParams } from "react-router-dom";
import InPageNavigation from "../components/inpage-navigation.component";
import { useEffect, useState } from "react";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import AnimationWrapper from "../common/page-animation";
import NoDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
import axios from "axios";
import { filterPaginationData } from "../common/filter-pagination-data";
import UserCard from "../components/usercard.component";

const SearchPage = () => {
  let { query } = useParams();
  let [blogs, setBlogs] = useState(null);
  let [users, setUsers] = useState(null);

  const searchBlogs = async ({ page = 1, create_new_arr = false }) => {
    try {
      const { data } = await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/blog/filter-blogs",
        { query, page },
      );
      let formatedData = await filterPaginationData({
        state: blogs,
        data: data.blogs,
        page,
        countRoute: "/blog/filter-blogs-count",
        data_to_send: { query },
        create_new_arr: page === 1,
      });
      setBlogs(formatedData);
    } catch (error) {
      console.error(error.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const {
        data: { users },
      } = await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/user/search-users",
        { query },
      );
      setUsers(users);
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    resetState();
    searchBlogs({ page: 1, create_new_arr: true });
    fetchUsers();
  }, [query]);

  const resetState = () => {
    setBlogs(null);
    setUsers(null);
  };

  const UserCardWrapper = () => {
    return (
      <>
        {users == null ? (
          <Loader />
        ) : users.length ? (
          users.map((user, i) => {
            return (
              <AnimationWrapper
                key={i}
                transition={{ duration: 1, delay: i * 0.08 }}>
                <UserCard user={user} />
              </AnimationWrapper>
            );
          })
        ) : (
          <NoDataMessage message={"No user found"} />
        )}
      </>
    );
  };
  return (
    <section className="h-cover flex justify-center gap-10">
      <div className="w-full">
        <InPageNavigation
          routes={[`Search Results for "${query}"`, "Accounts Matched"]}
          defaultHidden={["Accounts Matched"]}>
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
              <NoDataMessage message="No blogs published under this query" />
            )}

            <LoadMoreDataBtn state={blogs} fetchDataFun={searchBlogs} />
          </>

          <UserCardWrapper></UserCardWrapper>
        </InPageNavigation>
      </div>

      <div className="min-w-[40%] lg:min-w-[350px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
        <h1 className="font-medium text-xl mb-8">
          Users related to search <i className="fi fi-rr-user mt-1"></i>
        </h1>
        <UserCardWrapper />
      </div>
    </section>
  );
};

export default SearchPage;
