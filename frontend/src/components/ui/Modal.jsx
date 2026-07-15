import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  closeOnOverlayClick = true,
  className = '',
  ...props
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="sb-modal-overlay" onClick={handleOverlayClick}>
      <div className={`sb-modal-container sb-modal-${size} sb-fade-in ${className}`} {...props}>
        <div className="sb-modal-header">
          <h3 className="sb-modal-title">{title || 'Alert'}</h3>
          <button onClick={onClose} className="sb-modal-close-btn" title="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="sb-modal-body">
          {children}
        </div>
        {footer && (
          <div className="sb-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
