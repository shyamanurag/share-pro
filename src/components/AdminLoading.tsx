import React from 'react';

const AdminLoading: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
      <h1 className="text-2xl font-bold mb-2">Loading Admin Panel</h1>
      <p className="text-muted-foreground">Please wait while we authenticate your session...</p>
    </div>
  );
};

export default AdminLoading;