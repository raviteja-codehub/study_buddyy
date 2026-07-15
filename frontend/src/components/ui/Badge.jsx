import React from 'react';

export default function Badge({
  children,
  variant = 'frost', // 'frost', 'ember', 'signal', 'danger', 'easy', 'medium', 'hard', 'ghost'
  type = 'dim', // 'solid', 'dim', 'outline'
  className = '',
  style = {},
  ...props
}) {
  return (
    <span
      className={`sb-badge sb-badge-${variant} sb-badge-${type} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
}
