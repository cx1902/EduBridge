import React from 'react';
import { FaTimes, FaEnvelope, FaPhone, FaUser } from 'react-icons/fa';

const TutorContactModal = ({ tutor, onClose }) => {
    if (!tutor) return null;

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        },
        modal: {
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            borderRadius: '16px',
            width: '400px',
            maxWidth: '90%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid #334155',
            animation: 'fadeIn 0.2s ease-out'
        },
        header: {
            background: 'linear-gradient(to right, #4f46e5, #818cf8)',
            padding: '2rem 1.5rem',
            position: 'relative',
            textAlign: 'center'
        },
        closeBtn: {
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            transition: 'background 0.2s'
        },
        avatar: {
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            objectFit: 'cover',
            marginBottom: '1rem',
            backgroundColor: '#e0e7ff'
        },
        name: {
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold'
        },
        role: {
            fontSize: '0.875rem',
            opacity: 0.9,
            marginTop: '0.25rem'
        },
        content: {
            padding: '1.5rem'
        },
        row: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            marginBottom: '0.75rem',
            transition: 'transform 0.2s'
        },
        icon: {
            color: '#818cf8',
            fontSize: '1.25rem'
        },
        label: {
            display: 'block',
            fontSize: '0.75rem',
            color: '#94a3b8',
            marginBottom: '0.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
        },
        value: {
            fontSize: '1rem',
            color: '#e2e8f0',
            wordBreak: 'break-all'
        },
        footer: {
            padding: '1rem 1.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#9ca3af'
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <button style={styles.closeBtn} onClick={onClose}>
                        <FaTimes />
                    </button>
                    <img
                        src={tutor.user.profilePictureUrl || `https://ui-avatars.com/api/?name=${tutor.user.firstName}+${tutor.user.lastName}`}
                        alt="Profile"
                        style={styles.avatar}
                    />
                    <h2 style={styles.name}>{tutor.user.firstName} {tutor.user.lastName}</h2>
                    <div style={styles.role}>Qualified Tutor</div>
                </div>

                <div style={styles.content}>
                    <div style={styles.row}>
                        <FaEnvelope style={styles.icon} />
                        <div>
                            <span style={styles.label}>Email Address</span>
                            <div style={styles.value}>{tutor.user.email}</div>
                        </div>
                    </div>

                    <div style={styles.row}>
                        <FaPhone style={styles.icon} />
                        <div>
                            <span style={styles.label}>Phone Number</span>
                            <div style={styles.value}>{tutor.user.phoneNumber || 'Not provided'}</div>
                        </div>
                    </div>

                    <div style={styles.row}>
                        <FaUser style={styles.icon} />
                        <div>
                            <span style={styles.label}>Subjects</span>
                            <div style={styles.value}>
                                {tutor.tutorSubjects?.map(s => s.subject.name).join(', ') || 'General'}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={styles.footer}>
                    Contact this tutor to discuss your learning goals.
                </div>
            </div>
        </div>
    );
};

export default TutorContactModal;
