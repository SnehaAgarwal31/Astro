
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="relative z-20 text-black">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-lg font-bold">ASTRO</div>
        <ul className="flex space-x-6">
          <li><Link to="/" className="hover:text-gray-300">Home</Link></li>
          {/* <li><Link to="/about" className="hover:text-gray-300">About</Link></li>
          <li><Link to="/services" className="hover:text-gray-300">Services</Link></li>
          <li><Link to="/contact" className="hover:text-gray-300">Contact</Link></li> */}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
