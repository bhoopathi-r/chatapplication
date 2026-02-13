import React from 'react';
import PropTypes from 'prop-types';

/**
 * UserStatus Component
 * Displays user online/offline status with visual indicators
 * 
 * @param {boolean} isOnline - Whether the user is currently online
 * @param {Date|string} lastSeen - Last seen timestamp (for offline users)
 * @param {boolean} isTyping - Whether the user is currently typing
 * @param {string} size - Size variant: 'small', 'medium', 'large'
 * @param {boolean} showText - Whether to show status text
 * @param {boolean} showDot - Whether to show status dot indicator
 */
const UserStatus = ({
    isOnline = false,
    lastSeen = null,
    isTyping = false,
    size = 'medium',
    showText = true,
    showDot = true,
    className = ''
}) => {
    const getStatusText = () => {
        if (isTyping) return 'typing...';
        if (isOnline) return 'Online';
        if (lastSeen) {
            const lastSeenDate = new Date(lastSeen);
            const now = new Date();
            const diffMs = now - lastSeenDate;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return 'Offline';
        }
        return 'Offline';
    };

    const getStatusColor = () => {
        if (isTyping) return 'text-blue-500';
        if (isOnline) return 'text-green-500';
        return 'text-slate-400';
    };

    const getDotColor = () => {
        if (isTyping) return 'bg-blue-500';
        if (isOnline) return 'bg-green-500';
        return 'bg-slate-300';
    };

    const getDotSize = () => {
        switch (size) {
            case 'small': return 'w-2 h-2';
            case 'large': return 'w-4 h-4';
            default: return 'w-3 h-3';
        }
    };

    const getTextSize = () => {
        switch (size) {
            case 'small': return 'text-[10px]';
            case 'large': return 'text-sm';
            default: return 'text-xs';
        }
    };

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            {showDot && (
                <div className={`${getDotSize()} ${getDotColor()} rounded-full ${isTyping ? 'animate-pulse' : ''}`} />
            )}
            {showText && (
                <span className={`${getTextSize()} ${getStatusColor()} font-medium`}>
                    {getStatusText()}
                </span>
            )}
        </div>
    );
};

UserStatus.propTypes = {
    isOnline: PropTypes.bool,
    lastSeen: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    isTyping: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    showText: PropTypes.bool,
    showDot: PropTypes.bool,
    className: PropTypes.string,
};

export default UserStatus;
