import { Button } from '@headlessui/react';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { ChevronDownIcon, UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  user?: { username: string };
  onSignOut?: () => void;
}

export default function Header({ user, onSignOut }: HeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] animate-[slideDown_0.5s_ease-out_forwards] opacity-0 -translate-y-full">
      <header className="bg-white backdrop-blur-md border-b border-white/20 px-6 py-1">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/bodeev-logo.svg" 
              alt="BodeEV Logo" 
              className="h-10 w-auto relative top-8 z-50"
            />
          </div>

        {/* User Menu */}
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 text-sm">
              Welcome, {user.username}
            </span>
            
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors">
                <UserIcon className="h-5 w-5 text-gray-600" />
                <ChevronDownIcon className="h-4 w-4 text-gray-600" />
              </MenuButton>

              <MenuItems className="absolute right-0 mt-2 w-48 bg-white backdrop-blur-md rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <MenuItem>
                  {({ active }) => (
                    <button
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 w-full text-left`}
                    >
                      <UserIcon className="h-4 w-4" />
                      <span>Profile</span>
                    </button>
                  )}
                </MenuItem>
                
                <MenuItem>
                  {({ active }) => (
                    <button
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 w-full text-left`}
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                  )}
                </MenuItem>
                
                <div className="border-t border-gray-200 my-1" />
                
                <MenuItem>
                  {({ active }) => (
                    <Button
                      onClick={onSignOut}
                      className={`${
                        active ? 'bg-red-50 text-red-700' : 'text-red-600'
                      } flex items-center space-x-3 px-4 py-2 text-sm w-full text-left`}
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      <span>Sign Out</span>
                    </Button>
                  )}
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        ) : null}
        </div>
      </header>
      
      <div className="flex relative -z-10">
        {/* White background matching logo width */}
        <div className="h-12 bg-white backdrop-blur-md w-52" />
        {/* Corner SVG */}
        <div 
          className="h-12 bg-white backdrop-blur-md w-44"
          style={{
            maskImage: "url('/corner.svg')",
            WebkitMaskImage: "url('/corner.svg')",
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat"
          }}
        />
      </div>
    </div>
  );
}