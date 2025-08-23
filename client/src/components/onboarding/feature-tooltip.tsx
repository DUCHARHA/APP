import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Lightbulb } from 'lucide-react';

interface FeatureTooltipProps {
  id: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'auto';
  autoShowDelay?: number;
  children?: React.ReactNode;
}

export const FeatureTooltip: React.FC<FeatureTooltipProps> = ({
  id,
  title,
  description,
  position = 'top',
  trigger = 'hover',
  autoShowDelay = 3000,
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  const storageKey = `ducharkha_tooltip_${id}`;

  useEffect(() => {
    // Check if this tooltip has been shown before
    const tooltipShown = localStorage.getItem(storageKey);
    setHasBeenShown(!!tooltipShown);

    // Auto-show tooltip for first-time users
    if (!tooltipShown && trigger === 'auto') {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, autoShowDelay);

      return () => clearTimeout(timer);
    }
  }, [storageKey, trigger, autoShowDelay]);

  const handleShow = () => {
    if (!hasBeenShown || trigger !== 'auto') {
      setIsVisible(true);
    }
  };

  const handleHide = () => {
    setIsVisible(false);
    if (!hasBeenShown) {
      localStorage.setItem(storageKey, 'shown');
      setHasBeenShown(true);
    }
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 border-t-8 border-x-transparent border-x-8',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800 border-b-8 border-x-transparent border-x-8',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800 border-l-8 border-y-transparent border-y-8',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800 border-r-8 border-y-transparent border-y-8',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={trigger === 'hover' ? handleShow : undefined}
        onMouseLeave={trigger === 'hover' ? handleHide : undefined}
        onClick={trigger === 'click' ? () => setIsVisible(!isVisible) : undefined}
        className={trigger === 'click' ? 'cursor-pointer' : ''}
      >
        {children}
      </div>

      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-gray-800 text-white rounded-lg p-3 shadow-lg max-w-xs">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <h4 className="font-medium text-sm">{title}</h4>
              </div>
              <button
                onClick={handleHide}
                className="p-1 hover:bg-gray-700 rounded-full ml-2 flex-shrink-0"
                data-testid={`button-close-tooltip-${id}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-gray-200 leading-relaxed">{description}</p>
          </div>
          {/* Arrow */}
          <div className={`absolute w-0 h-0 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
};