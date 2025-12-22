export default function FormLabel({ htmlFor, label, required, labelClassName = '', variant = 'default' }: any) {
    if (!label) return null;
    
    const baseClasses = variant === 'checkbox' 
        ? 'ml-2 block text-sm text-gray-900' 
        : 'block text-sm font-medium text-gray-700';
    
    return (
        <label
            htmlFor={htmlFor}
            className={`${baseClasses} ${labelClassName}`}
        >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
    );
}

