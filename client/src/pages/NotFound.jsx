import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container text-center" style={{ paddingTop: '100px' }}>
      <h1 style={{ fontSize: '72px' }}>404</h1>
      <h2>Page Not Found</h2>
      <p className="text-secondary">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary mt-lg">
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
