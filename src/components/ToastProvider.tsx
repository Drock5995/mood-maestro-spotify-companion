"use client";

import { Toaster } from 'react-hot-toast';

const ToastProvider = () => {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        style: {
          background: '#1F2937', // A dark gray that fits the theme
          color: '#F9FAFB',     // Off-white text
          border: '1px solid #4B5563',
        },
      }}
    />
  );
};

export default ToastProvider;