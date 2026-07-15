import React from 'react';

export default function Tabs({
  tabs, // Array of { id, label, icon: Icon }
  activeTab,
  onChange,
  variant = 'pills', // 'pills', 'underline'
  className = '',
  style = {},
  ...props
}) {
  return (
    <div className={`sb-tabs-container sb-tabs-${variant} ${className}`} style={style} {...props}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`sb-tab-item ${isActive ? 'sb-tab-item-active' : ''}`}
            role="tab"
            aria-selected={isActive}
          >
            {Icon && <Icon size={15} style={{ marginRight: '6px' }} />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
