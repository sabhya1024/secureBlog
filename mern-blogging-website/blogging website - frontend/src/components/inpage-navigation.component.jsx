import { useEffect, useRef, useState } from "react";

const InPageNavigation = ({
  routes,
  defaultHidden = [],
  defaultActiveIndex = 0,
  children,
}) => {
  let activeTabLineRef = useRef();
  let activeTabRef = useRef();

  let [inPageNavIndex, setInPageNavIndex] = useState(defaultActiveIndex);

  let [width, setWidth] = useState(window.innerWidth);
  
  let [isResizeEvent, setIsResizeEvent] = useState(false);

  const changePageState = (btn, i) => {
    let { offsetWidth, offsetLeft } = btn;

    activeTabLineRef.current.style.width = offsetWidth + "px";
    activeTabLineRef.current.style.left = offsetLeft + "px";
    setInPageNavIndex(i);
  };

  useEffect(() => {
    if (width > 766 && inPageNavIndex !== defaultActiveIndex) {
      changePageState(activeTabRef.current, defaultActiveIndex);
    }
  }, [width]);

  useEffect(() => {
    changePageState(activeTabRef.current, defaultActiveIndex);

    if (!isResizeEvent) {
      window.addEventListener("resize", () => {
        if (!isResizeEvent) {
          setIsResizeEvent(true);
        }
        setWidth(window.innerWidth);
      });
    }
  }, []);

  return (
    <>
      <div className="relative mb-8 bg-white border-b border-grey flex flex-nowrap overflow-x-auto ">
        {routes.map((route, i) => {
          return (
            <button
              ref={i == defaultActiveIndex ? activeTabRef : null}
              key={i}
              className={
                "p-4 px-5 capitalize " +
                (inPageNavIndex == i ? "text-black" : "text-dark-grey ") +
                (defaultHidden.includes(route) ? " md:hidden " : " ")
              }
              onClick={(e) => {
                changePageState(e.target, i);
              }}>
              {route}
            </button>
          );
        })}

        <hr
          ref={activeTabLineRef}
          className="absolute bottom-0 duration-300 bg-black border-none h-[2px]"
        />
      </div>

          {
              Array.isArray(children) ? children[inPageNavIndex] : children
      }
    </>
  );
};

export default InPageNavigation;
