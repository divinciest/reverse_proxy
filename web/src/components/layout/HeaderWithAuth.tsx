import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  User, LogOut, Settings, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthHook';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationIcon from '@/notifications/NotificationIcon';

// Define the structure for the user data stored in localStorage
interface StoredUser {
  _id: string;
  email: string;
  username: string;
  bio: string | null;
  profilePicture: string | null;
  role: string;
}

// Helper function to get formatted date
const getFormattedDate = () => new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function HeaderWithAuth() {
  const { isAuthenticated, logout, user } = useAuth();
  const formattedDate = getFormattedDate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        try {
          const parsedUser: StoredUser = JSON.parse(storedUserData);
          if (parsedUser && parsedUser.role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, [isAuthenticated]);

  const getInitials = () => {
    const emailSource = user?.email;
    if (emailSource) {
      return emailSource[0].toUpperCase();
    }
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const parsedUser: StoredUser = JSON.parse(storedUserData);
        if (parsedUser?.email) return parsedUser.email[0].toUpperCase();
      } catch { /* ignore parse error */ }
    }
    return 'U';
  };

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      {isAuthenticated ? (
        <>
          <NotificationIcon />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  {/* Removed AvatarImage as profilePicture source is not confirmed */}
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Account</p>
                  {user?.email && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <>
          {/* Subscribe button made more prominent */}
          <Button asChild size="sm">
            <Link to="/signup">Subscribe</Link>
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link to="/login">Login</Link>
          </Button>
        </>
      )}
    </div>
  );
}

export default HeaderWithAuth;
