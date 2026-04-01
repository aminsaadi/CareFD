"use client";

import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const PasswordInput = React.forwardRef(({ className = '', ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        className={className}
        data-testid={props['data-testid'] || 'password-input'}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-carefd-gray hover:text-carefd-teal transition"
        aria-label="הצג/הסתר סיסמה"
        data-testid={`toggle-password-${props.name || props.id || 'default'}`}
      >
        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
