import React from 'react';
import * as Icons from 'lucide-react';

export const DynamicIcon = ({ name, className = 'h-5 w-5' }) => {
  const IconComponent = Icons[name] || Icons.Store;
  return <IconComponent className={className} />;
};

export default DynamicIcon;
