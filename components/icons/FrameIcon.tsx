
import React from 'react';

export const FrameIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.5} />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10H7z" />
  </svg>
);
