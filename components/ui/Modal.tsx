import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div 
      className="fixed inset-0 bg-[#091E42] bg-opacity-60 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full m-4 p-6 relative border border-[#DFE1E6] ${sizeClasses[size]}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#172B4D]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#5E6C84] hover:text-[#172B4D] text-2xl"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;