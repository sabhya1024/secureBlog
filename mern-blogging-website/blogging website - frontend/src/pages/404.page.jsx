import PageNotFoundImg from "../imgs/custom_404_background.png";
import logo from "../imgs/logo.png";
const PageNotFound = () => {
  return (
    <section className="h-cover relative flex flex-col items-center justify-center text-center overflow-hidden">
      <img
        src={PageNotFoundImg}
        className="select-none absolute top-0 left-0 w-full h-full object-cover z-0 opacity-60 dark:opacity-60"
      />
      
      <div className="relative z-10 bg-white/80 dark:bg-black/80 p-8 rounded-xl backdrop-blur-md shadow-2xl border border-grey">
        <h1 className="text-5xl font-gelasio leading-tight font-bold mb-4 text-black dark:text-white">Page not found</h1>
        <p className="text-xl text-black dark:text-white">
          The page you are looking for does not exist or has been moved. 
        </p>
        <p className="text-xl text-black dark:text-white mt-2">
          Please go back to{" "}
          <a href="/" className="text-black dark:text-white font-semibold underline hover:text-blue-500 transition-colors">
            home
          </a>
          .
        </p>
      </div>

      <div className="absolute bottom-10 flex flex-col items-center gap-2">
        <img src={logo} className="h-8 object-contain" alt="CheckHack Logo" />
        <p className="text-sm font-semibold text-black dark:text-white opacity-80">CheckHack</p>
      </div>
    </section>
  );
};

export default PageNotFound;