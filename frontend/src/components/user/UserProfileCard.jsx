import React from 'react';
import PropTypes from 'prop-types';
import UserStatus from './UserStatus';
import { User as UserIcon } from 'lucide-react';

/**
 * UserProfileCard Component
 * Displays user profile information with status indicator
 * 
 * @param {Object} user - User object containing id, name, email, avatar_url, status, last_seen
 * @param {boolean} isOnline - Whether the user is currently online
 * @param {boolean} isTyping - Whether the user is currently typing
 * @param {string} variant - Display variant: 'compact', 'default', 'detailed'
 * @param {boolean} showEmail - Whether to show user email
 * @param {Function} onClick - Click handler for the card
 * @param {boolean} isActive - Whether this card is currently active/selected
 */
const UserProfileCard = ({
    user,
    isOnline = false,
    isTyping = false,
    variant = 'default',
    showEmail = true,
    onClick = null,
    isActive = false,
    className = ''
}) => {
    if (!user) return null;

    const getAvatarSize = () => {
        switch (variant) {
            case 'compact': return 'w-8 h-8';
            case 'detailed': return 'w-16 h-16';
            default: return 'w-12 h-12';
        }
    };

    const getStatusSize = () => {
        switch (variant) {
            case 'compact': return 'small';
            case 'detailed': return 'large';
            default: return 'medium';
        }
    };

    const renderAvatar = () => (
        <div className="relative">
            <div className={`${getAvatarSize()} rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center font-bold text-white shadow-md`}>
                {user.avatar_url ? (
                    <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                    />
                ) : (
                    <span className={variant === 'compact' ? 'text-xs' : 'text-lg'}>
                        {user.name?.[0]?.toUpperCase() || <UserIcon size={variant === 'compact' ? 14 : 20} />}
                    </span>
                )}
            </div>
            {variant !== 'compact' && (
                <div className="absolute bottom-0 right-0">
                    <UserStatus
                        isOnline={isOnline}
                        isTyping={isTyping}
                        lastSeen={user.last_seen}
                        showText={false}
                        size={variant === 'detailed' ? 'medium' : 'small'}
                    />
                </div>
            )}
        </div>
    );

    const renderInfo = () => (
        <div className="flex-1 min-w-0">
            <h4 className={`font-semibold flex text-slate-800 truncate ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
                {user.name}
            </h4>
            {showEmail && user.email && variant !== 'compact' && (
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
            )}
            <UserStatus
                isOnline={isOnline}
                isTyping={isTyping}
                lastSeen={user.last_seen}
                size={getStatusSize()}
                showDot={variant === 'compact'}
            />
        </div>
    );

    const baseClasses = `flex items-center gap-3 transition-all ${className}`;
    const interactiveClasses = onClick ? 'cursor-pointer hover:bg-slate-50' : '';
    const activeClasses = isActive ? 'bg-primary-50 border-r-4 border-primary-500' : '';
    const paddingClasses = variant === 'compact' ? 'p-2' : variant === 'detailed' ? 'p-6' : 'p-4';

    const Component = onClick ? 'button' : 'div';

    return (
        <Component
            onClick={onClick}
            className={`${baseClasses} ${interactiveClasses} ${activeClasses} ${paddingClasses}`}
        >
            {renderAvatar()}
            {renderInfo()}
        </Component>
    );
};

UserProfileCard.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        email: PropTypes.string,
        avatar_url: PropTypes.string,
        status: PropTypes.string,
        last_seen: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    }).isRequired,
    isOnline: PropTypes.bool,
    isTyping: PropTypes.bool,
    variant: PropTypes.oneOf(['compact', 'default', 'detailed']),
    showEmail: PropTypes.bool,
    onClick: PropTypes.func,
    isActive: PropTypes.bool,
    className: PropTypes.string,
};

export default UserProfileCard;
