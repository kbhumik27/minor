import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, BarChart2, Shield, Zap, ArrowRight, Play } from 'lucide-react';
import Hero3D from '../components/Hero3D';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Hero3D />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-glow animate-pulse-glow">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            SmartFit
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
          <Link 
            to="/auth" 
            className="px-6 py-2 glass-card rounded-full hover:scale-105"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              AI-Powered Fitness Tracking
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Train Smarter, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-accent">
                Not Harder
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Advanced sensor technology meets machine learning to track your form, count your reps, and optimize your workout in real-time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/auth" 
                className="group relative px-8 py-4 bg-gradient-to-r from-primary to-accent rounded-full font-bold text-lg shadow-glow hover:shadow-accent-glow transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2 text-white">
                  Start Training Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              
              <button className="px-8 py-4 glass-card rounded-full font-bold text-lg flex items-center gap-2 group">
                <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" /> Watch Demo
              </button>
            </div>
          </div>
          
          {/* Right side is handled by the 3D background, but we can add floating cards here */}
          <div className="hidden md:block relative h-[500px]">
             {/* Floating Glass Card 1 */}
             <div className="absolute top-10 right-10 p-4 rounded-2xl glass-panel animate-float" style={{ animationDelay: '0s' }}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Calories Burned</p>
                    <p className="text-lg font-bold">450 kcal</p>
                  </div>
                </div>
                <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-[75%] bg-gradient-to-r from-accent to-red-500"></div>
                </div>
             </div>

             {/* Floating Glass Card 2 */}
             <div className="absolute bottom-20 left-10 p-4 rounded-2xl glass-panel animate-float" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Heart Rate</p>
                    <p className="text-lg font-bold">128 BPM</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Advanced Analytics</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our sensors capture every movement to provide detailed insights into your performance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Activity className="w-8 h-8 text-primary" />,
                title: "Real-time Tracking",
                desc: "Monitor your reps, sets, and form in real-time with millisecond precision."
              },
              {
                icon: <BarChart2 className="w-8 h-8 text-accent" />,
                title: "Performance Stats",
                desc: "Visualize your progress with detailed charts and historical data analysis."
              },
              {
                icon: <Shield className="w-8 h-8 text-success" />,
                title: "Form Correction",
                desc: "AI-driven suggestions to improve your posture and prevent injuries."
              }
            ].map((feature, idx) => (
              <div key={idx} className="group p-8 rounded-3xl glass-card hover:-translate-y-2">
                <div className="mb-6 p-4 rounded-2xl bg-secondary w-fit group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/10 bg-background">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">SmartFit</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2024 SmartFit Technologies. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
