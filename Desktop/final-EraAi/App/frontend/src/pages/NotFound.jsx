import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center text-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-8xl font-black gradient-text mb-4">404</div>
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-text-secondary mb-8">This page doesn't exist. Let's get you back on track.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-dark-card border border-dark-border text-white rounded-xl text-sm hover:bg-dark-hover transition-all">
            &larr; Go Back
          </button>
          <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-semibold btn-glow transition-all">
            Home &rarr;
          </button>
        </div>
      </motion.div>
    </div>
  );
}
