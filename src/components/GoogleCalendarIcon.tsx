import React from 'react';

export default function GoogleCalendarIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      className={className}
      aria-label="Google Calendar"
    >
      <rect width="24" height="24" rx="4.5" fill="#ffffff" />
      {/* Top red header */}
      <path d="M4.5 3C3.67 3 3 3.67 3 4.5V8H21V4.5C21 3.67 20.33 3 19.5 3H4.5Z" fill="#EA4335" />
      {/* Left blue border */}
      <path d="M3 8V19.5C3 20.33 3.67 21 4.5 21H8V8H3Z" fill="#4285F4" />
      {/* Bottom green border */}
      <path d="M8 21H19.5C20.33 21 21 20.33 21 19.5V17H8V21Z" fill="#34A853" />
      {/* Right yellow border */}
      <path d="M21 8H17V17H21V8Z" fill="#FBBC05" />
      {/* Inner white calendar face */}
      <rect x="7" y="7" width="10" height="11" rx="1" fill="#ffffff" />
      {/* Calendar date '31' */}
      <text
        x="12"
        y="15.2"
        fill="#1a73e8"
        fontSize="7.5"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        textAnchor="middle"
      >
        31
      </text>
    </svg>
  );
}
