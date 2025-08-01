import React, { useState, useEffect } from 'react';
import { useAuth, useTranslation } from '../../store';
import { Shirt, Eye, EyeOff, AlertCircle, Sparkles, MapPin, Globe, Phone } from 'lucide-react';

interface LocationInfo {
  ip: string;
  country: string;
  city: string;
  loading: boolean;
}

const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    ip: '',
    country: '',
    city: '',
    loading: true
  });

  // Fetch IP and location information
  useEffect(() => {
    const fetchLocationInfo = async () => {
      try {
        // Get IP address
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        
        // Get location based on IP
        const locationResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
        const locationData = await locationResponse.json();
        
        setLocationInfo({
          ip: ipData.ip,
          country: locationData.country_name || 'Unknown',
          city: locationData.city || 'Unknown',
          loading: false
        });
      } catch (error) {
        console.error('Error fetching location info:', error);
        setLocationInfo({
          ip: 'Unknown',
          country: 'Unknown',
          city: 'Unknown',
          loading: false
        });
      }
    };

    fetchLocationInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with Laundry Theme */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/loginBackground.png')`,
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/80 via-blue-900/70 to-teal-900/80"></div>
        
        {/* Animated Bubbles for Laundry Theme */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-4 h-4 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
          <div className="absolute top-40 right-20 w-6 h-6 bg-blue-200/30 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
          <div className="absolute bottom-32 left-20 w-3 h-3 bg-white/25 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }}></div>
          <div className="absolute top-60 left-1/3 w-5 h-5 bg-cyan-200/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }}></div>
          <div className="absolute bottom-20 right-1/4 w-4 h-4 bg-white/15 rounded-full animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.8s' }}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header Section */}
          <div className="text-center">
            {/* Logo Container */}
            <div className="mx-auto bg-white/10 backdrop-blur-md p-4 rounded-2xl w-24 h-24 flex items-center justify-center mb-6 shadow-2xl border-4 border-white/20">
              <img 
                src="/Logo.png" 
                alt="Garaad Wil-Waal Laundry Logo" 
                className="w-16 h-16 object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {t('login.title')}
            </h1>
            <p className="text-lg text-white/90 drop-shadow-md flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5" />
              {t('login.subtitle')}
              <Sparkles className="h-5 w-5" />
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 animate-shake">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700 text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                  {t('login.username')}
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-300 bg-white/80 backdrop-blur-sm placeholder-gray-400"
                    placeholder={t('login.username')}
                    autoComplete="username"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-300 bg-white/80 backdrop-blur-sm placeholder-gray-400"
                    placeholder={t('login.password')}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-600 transition-colors duration-200 p-1 rounded-lg hover:bg-cyan-50"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center group cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded-lg border-2 border-gray-300 text-cyan-600 focus:ring-cyan-500 focus:ring-2 transition-all duration-200" 
                  />
                  <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-200">
                    {t('login.remember')}
                  </span>
                </label>
                <a 
                  href="#" 
                  className="text-sm text-cyan-600 hover:text-cyan-800 font-medium transition-colors duration-200 hover:underline"
                >
                  {t('login.forgot')}
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-6 rounded-xl hover:from-cyan-600 hover:to-blue-700 focus:ring-4 focus:ring-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t('login.signing')}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Shirt className="h-5 w-5" />
                    <span>{t('login.signin')}</span>
                  </div>
                )}
              </button>
            </form>

            {/* Location Information */}
            <div className="mt-8 space-y-4">
              {/* IP and Location Info */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                {locationInfo.loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="text-sm text-blue-600">Detecting location...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2 text-blue-700">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm font-medium">IP: {locationInfo.ip}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-blue-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        You are logged in from {locationInfo.country}, {locationInfo.city}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Developer Credits */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Developed By
                  </p>
                  <p className="text-lg font-bold text-gray-800">
                    Ismail Mohamed
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>+251927802065</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>+251910038340</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-white/80 text-sm drop-shadow-md">
              © 2024 Garaadka Laundry Management System
            </p>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoginForm;