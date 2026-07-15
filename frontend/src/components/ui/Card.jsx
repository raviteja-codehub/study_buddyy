import React from 'react';

export default function Card({
  children,
  title,
  subtitle,
  headerActions,
  footer,
  hoverable = false,
  className = '',
  style = {},
  bodyStyle = {},
  ...props
}) {
  return (
    <div
      className={`sb-card ${hoverable ? 'sb-card-hoverable' : ''} ${className}`}
      style={style}
      {...props}
    >
      {(title || subtitle || headerActions) && (
        <div className="sb-card-header">
          <div>
            {title && <h3 className="sb-card-title">{title}</h3>}
            {subtitle && <p className="sb-card-subtitle">{subtitle}</p>}
          </div>
          {headerActions && <div className="sb-card-actions">{headerActions}</div>}
        </div>
      )}
      <div className="sb-card-body" style={bodyStyle}>
        {children}
      </div>
      {footer && <div className="sb-card-footer">{footer}</div>}
    </div>
  );
}
