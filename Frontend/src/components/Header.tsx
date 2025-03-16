import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm h-fit">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/edumatrixLogo.png" alt="Edumatrix Logo" className="w-20 h-20" />
        </Link>

        {location.pathname === '/' ? (
          <div className="flex gap-x-80 items-center">
            <nav className="hidden lg:flex space-x-8">
              <a href="/" className="text-gray-700 hover:text-blue-400 transition-colors font-medium text-base">
                Home
              </a>
              <a href="#about" className="text-gray-700 hover:text-blue-400 transition-colors font-medium text-base">
                About
              </a>
              <a href="#features" className="text-gray-700 hover:text-blue-400 transition-colors font-medium text-base">
                Features
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-400 transition-colors font-medium text-base">
                Pricing
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/signin">
                <Button className="text-base px-6 py-2 text-gray-700 border-gray-300 hover:bg-gray-50" variant="outline">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="text-base px-6 py-2 bg-blue-400 text-white hover:bg-blue-500">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}