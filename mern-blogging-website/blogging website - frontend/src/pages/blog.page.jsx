import api from "../common/api";
import { createContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { getDay } from "../common/date";
import BlogInteraction from "../components/blog-interaction.component";
import BlogPostCard from "../components/blog-post.component";
import BlogContent from "../components/blog-content.component";
import CommentsContainer, {
  fetchComments,
} from "../components/comments.component";

export const blogStructure = {
  title: "",
  des: "",
  content: [],
  tags: [],
  author: { personal_info: { fullname: "", username: "", profile_img: "" } },
  banner: "",
  publishedAt: "",
};

export const BlogContext = createContext({});

const BlogPage = () => {
  let { blog_id } = useParams();
  const [blog, setBlog] = useState(blogStructure);
  const [similarBlogs, setSimilarBlogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLikedByUser, setLikedByUser] = useState(false);
  const [commentsWrapper, setCommentsWrapper] = useState(false);
  const [totalParentCommentsLoaded, setTotalParentCommentsLoaded] = useState(0);

  let {
    title,
    content,
    banner,
    author,
    publishedAt,
    tags,
  } = blog;

  let {
    fullname,
    username: author_username,
    profile_img,
  } = author?.personal_info || {
    fullname: "Deleted User",
    username: "unknown",
    profile_img: "https://api.dicebear.com/6.x/bottts/svg?seed=Unknown",
  };

  const fetchBlog = async () => {
    try {
      const {
        data: { blog },
      } = await api.post(
        import.meta.env.VITE_BACKEND_URL + "/blog/get-blog",
        { blog_id },
      );

      const comments = await fetchComments({
        blog_id: blog._id,
        setParentCommentCountFun: setTotalParentCommentsLoaded,
      });

      blog.comments = comments;
      setBlog(blog);

      if (blog.tags?.length) {
        try {
          const { data } = await api.post(
            import.meta.env.VITE_BACKEND_URL + "/blog/search-blogs",
            { tag: blog.tags[0], limit: 6, eliminate_blog: blog_id },
          );
          setSimilarBlogs(data.blogs);
        } catch (err) {
          console.error("Failed to fetch similar blogs:", err);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch blog:", err);
      setLoading(false);
    }
  };

  const resetStates = () => {
    setBlog(blogStructure);
    setSimilarBlogs(null);
    setLoading(true);
    setLikedByUser(false);
    setCommentsWrapper(false);
    setTotalParentCommentsLoaded(0);
  };

  useEffect(() => {
    resetStates();
    fetchBlog();
  }, [blog_id]);

  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <BlogContext.Provider
          value={{
            blog,
            setBlog,
            isLikedByUser,
            setLikedByUser,
            commentsWrapper,
            setCommentsWrapper,
            totalParentCommentsLoaded,
            setTotalParentCommentsLoaded,
          }}>
          <CommentsContainer />
          <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">
            <img src={banner} className="aspect-video w-full rounded" />

            <div className="mt-12">
              <h2 className="text-4xl font-bold">{title}</h2>

              <div className="flex max-sm:flex-col justify-between my-8">
                <div className="flex gap-5 items-start">
                  <img src={profile_img} className="w-12 h-12 rounded-full" />
                  <p className="capitalize">
                    {fullname}
                    <br />@
                    <Link to={`/user/${author_username}`} className="underline">
                      {author_username}
                    </Link>
                  </p>
                </div>
                <p className="text-dark-grey opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5">
                  Published on {getDay(publishedAt)}
                </p>
              </div>
            </div>

            <BlogInteraction />

            {/* Blog Content Rendering */}
            <div className="my-12 font-gelasio blog-page-content">
              {(Array.isArray(content)
                ? content[0]?.blocks
                : content?.blocks
              )?.map((block, i) => {
                return (
                  <div key={i} className="my-4 md:my-8">
                    <BlogContent block={block} />
                  </div>
                );
              })}
            </div>

            <BlogInteraction />

            {/* Similar Blogs Section */}
            {similarBlogs !== null && similarBlogs.length ? (
              <>
                <h1 className="text-2xl mt-14 mb-10 font-medium">
                  Similar Blogs
                </h1>

                {similarBlogs.map((blog, i) => {
                  let personal_info = blog.author?.personal_info || {
                    fullname: "Deleted User",
                    username: "unknown",
                    profile_img: "https://api.dicebear.com/6.x/bottts/svg?seed=Unknown",
                  };

                  return (
                    <AnimationWrapper
                      key={i}
                      transition={{ duration: 1, delay: i * 0.08 }}>
                      <BlogPostCard content={blog} author={personal_info} />
                    </AnimationWrapper>
                  );
                })}
              </>
            ) : (
              " "
            )}
          </div>
        </BlogContext.Provider>
      )}
    </AnimationWrapper>
  );
};

export default BlogPage;
