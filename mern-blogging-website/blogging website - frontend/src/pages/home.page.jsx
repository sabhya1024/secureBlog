import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import { useEffect, useState } from "react";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";

const HomePage = () => {
  let [blogs, setBlog] = useState(null);
  let [pageState, setPageState] = useState("home");
  let [categories, setCategories] = useState([]);

  // Search & Filter States
  let [searchQuery, setSearchQuery] = useState("");
  let [activeFilter, setActiveFilter] = useState("latest");

  const fetchCategories = async () => {
    try {
      let { data } = await axios.get(
        import.meta.env.VITE_SERVER_DOMAIN + "/api/blog/categories",
      );
      setCategories(data.categories);
    } catch (error) {
      console.log(error.message);
    }
  };

  // Unified fetch function for the home feed
  const fetchBlogs = async ({ page = 1 } = {}) => {
    try {
      if (page === 1) setBlog(null); // trigger loader only on initial fetch

      if (pageState !== "home") {
        // Fetching by Category Pill
        let { data } = await axios.post(
          import.meta.env.VITE_SERVER_DOMAIN + "/api/blog/search-blogs",
          { tag: pageState, page }
        );
        let formatedData = await filterPaginationData({
          state: blogs,
          data: data.blogs,
          page,
          countRoute: "/api/blog/search-blogs-count",
          data_to_send: { tag: pageState },
          create_new_arr: page === 1
        });
        setBlog(formatedData);
      } else {
        // Fetching main feed (with or without search/filters)
        let { data } = await axios.post(
          import.meta.env.VITE_SERVER_DOMAIN + "/api/blog/filter-blogs",
          { query: searchQuery, filterBy: activeFilter, page }
        );
        let formatedData = await filterPaginationData({
          state: blogs,
          data: data.blogs,
          page,
          countRoute: "/api/blog/filter-blogs-count",
          data_to_send: { query: searchQuery, filterBy: activeFilter },
          create_new_arr: page === 1
        });
        setBlog(formatedData);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const loadBlogByCategory = (e) => {
    let category = e.target.innerText.toLowerCase();

    // Clear search query if we are clicking a category
    setSearchQuery("");

    if (pageState === category) {
      setPageState("home");
    } else {
      setPageState(category);
    }
  };

  const handleSearch = (e) => {
    if (e.keyCode === 13) {
      // User hit Enter in the search bar
      setPageState("home"); // Reset category if searching
      fetchBlogs();
    }
  };

  const handleFilterChange = (e) => {
    setActiveFilter(e.target.value);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Re-fetch blogs whenever the pageState (category) or activeFilter changes
  useEffect(() => {
      fetchBlogs();
  }, [pageState, activeFilter]);

  return (
    <>
      <AnimationWrapper>
        <section className="h-cover flex justify-center gap-10">
          {/* main feed */}
          <div className="w-full">
            <InPageNavigation
              routes={["home", "categories"]}
              defaultHidden={["categories"]}>
              {/* Home Feed Context (Search & Filter UI) */}
              <>
                <div className="flex gap-4 mb-8 flex-col sm:flex-row items-center">


                  <div className="relative w-full sm:w-auto">
                    <i className="fi fi-rr-settings-sliders absolute left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey pointer-events-none"></i>
                    <select
                      className="bg-grey p-4 pl-12 pr-10 rounded-full outline-none w-full sm:w-auto capitalize cursor-pointer hover:bg-black/5 transition-colors appearance-none"
                      value={activeFilter}
                      onChange={handleFilterChange}>
                      <option value="latest">Latest First</option>
                      <option value="most relevant">Most Relevant</option>
                      <option value="most liked">Most Liked</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                    {/* Custom down arrow since we used appearance-none on the select */}
                    <i className="fi fi-rr-angle-small-down absolute right-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey pointer-events-none"></i>
                  </div>
                </div>

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
                  <NoDataMessage message={pageState === "home" ? "No blogs published" : "No blogs published in this category"} />
                              )}
                              
                              <LoadMoreDataBtn state={blogs} fetchDataFun={fetchBlogs} />
              </>

              {/* mobile categories section inside in-page navigation */}
              <div className="md:hidden">
                <h1 className="font-medium text-xl mb-8">Discover</h1>
                <div className="flex gap-3 flex-wrap">
                  {categories?.length ? (
                    categories.map((category, i) => {
                      return (
                        <button
                          onClick={loadBlogByCategory}
                          className={
                            "tag " +
                            (pageState == category
                              ? " bg-black text-white "
                              : " ")
                          }
                          key={i}>
                          {category}
                        </button>
                      );
                    })
                  ) : (
                    <NoDataMessage message="No categories found" />
                  )}
                </div>
              </div>
            </InPageNavigation>
          </div>

          {/* desktop filters/categories sidebar */}
          <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
            <div className="flex flex-col gap-10">
              <div>
                <h1 className="font-medium text-xl mb-8">Categories</h1>
                <div className="flex gap-3 flex-wrap">
                  {categories?.length ? (
                    categories.map((category, i) => {
                      return (
                        <button
                          onClick={loadBlogByCategory}
                          className={
                            "tag " +
                            (pageState == category
                              ? " bg-black text-white "
                              : " ")
                          }
                          key={i}>
                          {category}
                        </button>
                      );
                    })
                  ) : (
                    <NoDataMessage message="No categories found" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default HomePage;
