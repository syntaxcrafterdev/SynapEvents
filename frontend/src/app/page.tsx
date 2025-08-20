"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Code, Users, Trophy, Calendar, GitBranch, Award, Clock, MessageSquare, Settings, FileText, Sparkles, Zap, Shield, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import Background from '@/components/ui/background';
import Card3D from '@/components/ui/card-3d';
import ShimmerButton from '@/components/ui/shimmer-button';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <Background className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.05]" />
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
        </div>
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6 border border-white/10"
            >
              <Sparkles className="h-4 w-4" />
              The future of hackathons is here
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
            >
              Build, Compete, <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-500">Innovate</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl mb-10 text-white/90 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Join the most exciting hackathons and tech events. Collaborate with talented developers,
              designers, and innovators from around the world.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50 hover:scale-105 transition-transform">
                <Link href="/events" className="flex items-center">
                  Explore Events <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-transform">
                <Link href="/auth/register" className="flex items-center">
                  Get Started <Zap className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-4">
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to build amazing projects</h2>
            <p className="text-muted-foreground">
              SynapEvents provides all the tools and resources you need to turn your ideas into reality.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Code className="h-6 w-6 text-blue-500" />,
                title: "Real-time Collaboration",
                description: "Work seamlessly with your team in real-time with our collaborative coding environment."
              },
              {
                icon: <Zap className="h-6 w-6 text-purple-500" />,
                title: "Lightning Fast",
                description: "Built with Next.js for optimal performance and fast page loads."
              },
              {
                icon: <Shield className="h-6 w-6 text-green-500" />,
                title: "Secure & Reliable",
                description: "Enterprise-grade security to keep your projects and data safe."
              },
              {
                icon: <Globe className="h-6 w-6 text-amber-500" />,
                title: "Global Community",
                description: "Connect with developers and designers from around the world."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-br from-card to-card/80 p-6 rounded-xl shadow-lg border border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to start building?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of developers and designers creating amazing projects on SynapEvents.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50 hover:scale-105 transition-transform">
                <Link href="/auth/register" className="flex items-center">
                  Get Started for Free <Zap className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10 hover:scale-105 transition-transform">
                <Link href="/events" className="flex items-center">
                  Browse Events <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by developers worldwide</h2>
            <p className="text-muted-foreground">Join thousands of developers building the future with SynapEvents</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { value: '10,000+', label: 'Active Developers' },
              { value: '500+', label: 'Hackathons Hosted' },
              { value: '1M+', label: 'Lines of Code' },
            ].map((stat, index) => (
              <Card3D 
                key={index}
                className="p-8 text-center"
                intensity={15}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <div className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
                    {stat.value}
                  </div>
                  <p className="text-muted-foreground">{stat.label}</p>
                </motion.div>
              </Card3D>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Card3D className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-primary/10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to build something amazing?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join our community of developers and start creating the next big thing today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ShimmerButton className="text-lg">
                  Get Started for Free
                </ShimmerButton>
                <button className="px-6 py-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-foreground">
                  Learn More
                </button>
              </div>
            </motion.div>
          </Card3D>
        </div>
      </section>
    </Background>
  );
}
