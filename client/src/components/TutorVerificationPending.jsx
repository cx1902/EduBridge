import React from 'react';
import { Link } from 'react-router-dom';

const TutorVerificationPending = () => {
    return (
        <div className="container" style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
            <div className="card" style={{ padding: '3rem' }}>
                {/* Animated Spinner */}
                <div style={{
                    fontSize: '4rem',
                    marginBottom: '1rem',
                    display: 'inline-block',
                    animation: 'spin 2s linear infinite'
                }}>
                    ⏱️
                </div>
                <style>
                    {`
                        @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    `}
                </style>
                <h1 style={{ marginBottom: '1rem' }}>Verification Pending</h1>
                <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>
                    Your tutor account is currently pending verification by our admin team.
                </p>

                <div style={{ backgroundColor: '#fef3c7', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#92400e' }}>What's Next?</h3>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#78350f' }}>
                        <li>Our admin team will review your application</li>
                        <li>You'll receive an email notification once approved</li>
                        <li>This usually takes 1-2 business days</li>
                    </ul>
                </div>

                <div style={{ backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#111827' }}>While You Wait</h3>
                    <p style={{ margin: 0, color: '#374151' }}>
                        You can still access your profile settings and browse the platform, but course creation and other tutor features are temporarily disabled until your account is verified.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link to="/profile" className="btn btn-primary">
                        View Profile
                    </Link>
                    <Link to="/courses" className="btn btn-outline">
                        Browse Courses
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TutorVerificationPending;
