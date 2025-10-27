import logo from "../assets/logoName.png";

const Footer = () => {
  return (
    <footer className=" py-4 text-center w-full">
      <p className="text-base flex items-center justify-end mr-10">
        &copy; {new Date().getFullYear()}{" "}
        <img src={logo} alt="Logo" className="h-10 mx-2 inline-block" /> All
        rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
