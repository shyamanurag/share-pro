import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <>
      <Head>
        <title>TradePaper - Paper Trading App</title>
        <meta name="description" content="Experience stock trading without risk. TradePaper is a paper trading app that simulates real market conditions." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-background min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col">
          {/* Hero Section */}
          <section className="relative py-12 md:py-20 px-4">
            <motion.div 
              className="max-w-7xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.h1 
                className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.7 }}
              >
                Trade Stocks Risk-Free
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.7 }}
              >
                Experience the thrill of stock trading without risking real money. 
                TradePaper gives you $10,000 in virtual cash to practice trading in a real-time market environment.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.7 }}
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-6 text-lg rounded-full"
                  onClick={() => router.push(user ? "/dashboard" : "/signup")}
                >
                  {user ? "Go to Dashboard" : "Start Trading Now"}
                </Button>
              </motion.div>
            </motion.div>
            
            {/* Mobile App Mockup */}
            <motion.div 
              className="mt-16 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.7 }}
            >
              <div className="relative mx-auto w-72 h-[500px] bg-black rounded-[40px] shadow-xl overflow-hidden border-[14px] border-black">
                <div className="absolute top-0 w-full h-6 bg-black rounded-t-lg"></div>
                <div className="h-full w-full bg-gradient-to-b from-gray-900 to-gray-800 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
                    alt="Trading App Interface" 
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-6">
                    <h3 className="text-2xl font-bold mb-4">TradePaper</h3>
                    <p className="text-sm mb-6 text-center">Your virtual trading journey starts here</p>
                    <div className="w-full bg-white/10 rounded-xl p-4 backdrop-blur-sm mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs">AAPL</span>
                        <span className="text-xs text-green-400">+2.45%</span>
                      </div>
                      <div className="h-12 bg-black/20 rounded-lg mb-2"></div>
                    </div>
                    <div className="w-full bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs">TSLA</span>
                        <span className="text-xs text-red-400">-1.23%</span>
                      </div>
                      <div className="h-12 bg-black/20 rounded-lg mb-2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Features Section */}
          <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
              <motion.h2 
                className="text-3xl font-bold text-center mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Why Choose TradePaper?
              </motion.h2>
              
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                <motion.div variants={item}>
                  <Card className="h-full border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="pt-6">
                      <div className="rounded-full bg-green-100 dark:bg-green-900 w-12 h-12 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600 dark:text-green-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Real-Time Market Data</h3>
                      <p className="text-muted-foreground">Practice with actual market conditions and real-time stock prices.</p>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div variants={item}>
                  <Card className="h-full border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="pt-6">
                      <div className="rounded-full bg-blue-100 dark:bg-blue-900 w-12 h-12 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600 dark:text-blue-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Risk-Free Trading</h3>
                      <p className="text-muted-foreground">Start with $10,000 in virtual money and trade without financial risk.</p>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div variants={item}>
                  <Card className="h-full border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="pt-6">
                      <div className="rounded-full bg-purple-100 dark:bg-purple-900 w-12 h-12 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600 dark:text-purple-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Performance Tracking</h3>
                      <p className="text-muted-foreground">Monitor your trading performance and learn from your decisions.</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </div>
          </section>
          
          {/* CTA Section */}
          <section className="py-16 px-4">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl font-bold mb-6">Ready to Start Your Trading Journey?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of users who are learning to trade with TradePaper. 
                No credit card required, completely free.
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-6 text-lg rounded-full"
                onClick={() => router.push(user ? "/dashboard" : "/signup")}
              >
                {user ? "Go to Dashboard" : "Create Free Account"}
              </Button>
            </motion.div>
          </section>
        </main>
      </div>
    </>
  );
}
