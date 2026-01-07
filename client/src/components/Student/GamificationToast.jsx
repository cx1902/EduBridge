import React, { useEffect, useState } from 'react';
import './GamificationToast.css'; // verify if we need css or inline

const GamificationToast = ({ xpGained, newBadges, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="gamification-toast">
            <div className="toast-content">
                <div className="xp-gain">
                    <i className="fas fa-star xp-icon"></i>
                    <span>+{xpGained} XP</span>
                </div>
                {newBadges && newBadges.length > 0 && (
                    <div className="badges-gained">
                        {newBadges.map((badge, idx) => (
                            <div key={idx} className="badge-item">
                                <i className="fas fa-medal"></i>
                                <span>Unlocked: {badge.name.replace('_', ' ')}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GamificationToast;
