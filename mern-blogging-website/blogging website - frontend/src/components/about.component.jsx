import { getDay } from "../common/date";

const isSafeUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const AboutUser = ({ className, bio, social_links = {}, joinedAt }) => {
  return (
    <div className={"md:w-[90%] md:mt-7 " + (className || "")}>
      <p className="text-xl leading-7">
        {bio?.length ? bio : "Nothing to read here"}
      </p>

      <div className="flex gap-x-7 gap-y-2 flex-wrap my-7 items-center text-dark-grey">
        {Object.keys(social_links).map((key) => {
          let link = social_links[key];
          const safe = isSafeUrl(link);

          return safe ? (
            <a href={link} key={key} target="_blank" rel="noopener noreferrer">
              <i
                className={
                  "fi " +
                  (key !== "website" ? "fi-brands-" + key : "fi-rr-globe") +
                  " text-2xl hover:text-black"
                }
              ></i>
            </a>
          ) : (
            <i
              key={key}
              className={
                "fi " +
                (key !== "website" ? "fi-brands-" + key : "fi-rr-globe") +
                " text-2xl opacity-20 cursor-not-allowed"
              }
              title={`No valid ${key} link provided`}
            ></i>
          );
        })}
      </div>

      <p className="text-xl leading-7 text-dark-grey">
        Joined on {getDay(joinedAt)}
      </p>
    </div>
  );
};

export default AboutUser;
