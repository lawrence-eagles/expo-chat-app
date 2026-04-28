import { SignInButton, SignUpButton } from "@clerk/react";
import { ArrowRightIcon, ArrowUpRightIcon, SparklesIcon } from "lucide-react";

const HomePage = () => {
  return (
    <div className="h-screen bg-black text-base flex">
      {/* Left side */}
      <div className="flex flex-1 flex-col p-8 lg:p-12 relative overflow-hidden">
        {/* Navbar */}
        <nav className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-gray-500/20">
              <SparklesIcon className="w-5 h-5 text-primary-content" />
            </div>
            <span className="text-xl font-bold text-white">Expo Chat</span>
          </div>

          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <button className="btn btn-soft rounded-full px-5 py-2.5 text-sm font-medium text-base-content opacity-60 hover:text-base-content transition-all">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-sm font-semibold rounded-full hover:opacity-90 shadow-lg shadow-orange-500/25 border-none">
                Get Started
                <ArrowUpRightIcon className="w-4 h-4" />
              </button>
            </SignUpButton>
          </div>
        </nav>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center max-w-xl relative z-10">
          {/* Tag */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Now Avaliable
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight font-mono text-white opacity-70">
            Messaging for
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              everyone
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-lg text-white opacity-70 leading-relaxed max-w-md">
            Secure,blazing-fast conversations with real-time presence and
            instant delivery. Connect with anyone, anywhere.
          </p>

          {/* CTA BTNS */}
          <div className="mt-10 flex items-center gap-4">
            <SignUpButton mode="modal">
              <button className="group flex items-center gap-3 px-8 py-4 bg-base-100 text-base-content font-semibold rounded-2xl hover:bg-base-200 transition-all">
                Start chatting
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignUpButton>

            <SignInButton mode="modal">
              <button className="btn btn-soft px-8 py-4 text-base-content opacity-60 font-semibold hover:text-base-content transition">
                I have an account
              </button>
            </SignInButton>
          </div>

          {/* Avatars */}
          <div className="mt-8 flex items-center gap-4">
            <div className="avatar-group -space-x-3">
              <div className="avatar">
                <div className="w-10 rounded-full border-2 border-base-100">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                    alt="User avatar"
                  />
                </div>
              </div>

              <div className="avatar">
                <div className="w-10 rounded-full border-2 border-base-100">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                    alt="User avatar"
                  />
                </div>
              </div>

              <div className="avatar">
                <div className="w-10 rounded-full border-2 border-base-100">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
                    alt="User avatar"
                  />
                </div>
              </div>

              <div className="avatar avatar-placeholder">
                <div className="w-10 rounded-full border-2 border-base-100 bg-base-300 text-base-content">
                  <span className="text-xs font-mono">+5K</span>
                </div>
              </div>
            </div>

            <span className="text-sm text-white opacity-70">
              Join{" "}
              <span className="font-mono text-white opacity-80">10,000+</span>{" "}
              happy users
            </span>
          </div>

          {/* Stats */}
          <div className="mt-12 flex items-center gap-10">
            <div>
              <div className="text-2xl font-bold text-white font-mono">
                10K+
              </div>
              <div className="text-xs text-white opacity-60 mt-1 uppercase tracking-wider">
                Users
              </div>
            </div>
            <div className="w-px h-10 bg-white opacity-10" />
            <div>
              <div className="text-2xl font-bold text-white font-mono">
                99.9%
              </div>
              <div className="text-xs text-white opacity-60 mt-1 uppercase tracking-wider">
                Uptime
              </div>
            </div>
            <div className="w-px h-10 bg-white opacity-10" />
            <div>
              <div className="text-2xl font-bold text-white font-mono">
                &lt;50ms
              </div>
              <div className="text-xs text-white opacity-60 mt-1 uppercase tracking-wider">
                Latency
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="hidden lg:flex flex-1 relative bg-black items-center justify-center overflow-hidden">
        {/* Grid Pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.08) 1px,transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-[100px]" />

        {/* Image container */}
        <div className="relative z-10">
          {/* Decorative border */}
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-white/20 to-white/5 p-px">
            <div className="w-full h-full rounded-3xl bg-black" />
          </div>

          {/* Card */}
          <div className="relative p-6 rounded-3xl border border-black bg-black/80 backdrop-blur-xl shadow-2xl">
            <img
              src="/auth.png"
              alt="chat illustration"
              className="w-80 xl:w-96 rounded-2xl"
            />

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-medium backgrop-blur-sm">
              ● 3 online
            </div>

            <div className="absolute -bottom-4 -left-4 px-4 py-2.5 bg-black/40 border border-black rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-pink-500" />
                </div>
                <span className="text-sm text-white/80">typing...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
