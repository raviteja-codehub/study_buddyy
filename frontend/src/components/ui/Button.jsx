import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'ghost', 'outline'
  size = 'md', // 'sm', 'md', 'lg'
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  icon: Icon,
  style = {},
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`sb-btn sb-btn-${variant} sb-btn-${size} ${fullWidth ? 'sb-btn-full' : ''} ${className}`}
      style={style}
      {...props}
    >
      {loading && <Loader2 className="sb-spin mr-2 animate-spin" size={15} style={{ marginRight: '6px' }} />}
      {!loading && Icon && <Icon size={15} style={{ marginRight: '6px' }} />}
      {children}
    </button>
  );
}
