import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import FormHelperText from './FormHelperText';
import FormLabel from './FormLabel';

export default function FormInput({
    label,
    error,
    labelClassName = '',
    containerClassName = '',
    className = '',
    id,
    helperText,
    required,
    ...props
}: any) {
    const inputId = id || props.name;
    const { required: _, type, ...inputProps } = props;
    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = useState(false);
    
    const baseInputClasses = 'mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm';
    const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '';
    const passwordPadding = isPassword ? 'pr-10' : '';
    const finalInputClasses = `${baseInputClasses} ${errorClasses} ${passwordPadding} ${className}`;

    return (
        <div className={containerClassName}>
            <FormLabel htmlFor={inputId} label={label} required={required} labelClassName={labelClassName} />
            <div className="relative">
                <input
                    id={inputId}
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    className={finalInputClasses}
                    {...inputProps}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowPassword(!showPassword);
                        }}
                        className="absolute top-1/2 right-0 -translate-y-1/2 pr-3 flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none z-20 pointer-events-auto"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5 pointer-events-none" />
                        ) : (
                            <EyeIcon className="h-5 w-5 pointer-events-none" />
                        )}
                    </button>
                )}
            </div>
            <FormHelperText error={error} helperText={helperText} />
        </div>
    );
}

