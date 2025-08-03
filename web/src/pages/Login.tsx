import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuthHook';
import { useDarkMode } from '@/hooks/useDarkMode';
import LoginForm from '@/components/auth/LoginForm';
import { Moon, Sun } from 'lucide-react';

function Login() {
  const { isAuthenticated } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/browse" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08) 0%, transparent 50%)
          `,
            opacity: '0.8',
            filter: 'blur(100px)',
          }}
        />

        <div
          className="absolute inset-0 z-0 pointer-events-none hidden dark:block"
          style={{
            background: `
            radial-gradient(circle at 25% 75%, rgba(30,30,30,0.12) 0%, transparent 50%),
            radial-gradient(circle at 75% 25%, rgba(30,30,30,0.12) 0%, transparent 50%)
          `,
            opacity: '0.6',
            filter: 'blur(100px)',
          }}
        />
      </div>

      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-background/20 backdrop-blur-sm border border-border/20 hover:bg-background/30 transition-all duration-200 shadow-lg"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5 text-foreground" />
          ) : (
            <Moon className="h-5 w-5 text-foreground" />
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8 min-h-screen">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground opacity-95 mb-3 sm:mb-4"
              style={{
                fontFamily: 'Playfair Display, Times, serif',
                letterSpacing: '0.01em',
                lineHeight: 1.1,
              }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                Welcome Back
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed px-2">
              Sign in to your account to explore and manage your financial news universe
            </p>
          </div>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div
            className="relative rounded-2xl p-6 sm:p-8 overflow-hidden mx-4 sm:mx-0"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(30px) saturate(180%)',
              WebkitBackdropFilter: 'blur(30px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: `
                0 20px 40px 0 rgba(31, 38, 135, 0.15),
                inset 0 0 0 1px rgba(255, 255, 255, 0.08),
                0 0 0 1px rgba(255, 255, 255, 0.02)
              `,
            }}
          >
            {/* Enhanced glassmorphism lighting effects */}
            <div
              className="absolute top-0 left-0 w-full h-full pointer-events-none block dark:hidden"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 60%)',
              }}
            />
            <div
              className="absolute top-0 left-0 w-full h-full pointer-events-none hidden dark:block"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)',
              }}
            />

            <LoginForm />
          </div>
        </div>

        {/* Footer text */}
        <div className="mt-6 sm:mt-8 text-center px-4">
          <p className="text-sm text-muted-foreground">
            Secure access to your personalized financial insights
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
