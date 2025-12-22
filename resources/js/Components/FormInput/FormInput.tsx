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
    const { required: _, ...inputProps } = props;
    const baseInputClasses = 'mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm';
    const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '';
    const finalInputClasses = `${baseInputClasses} ${errorClasses} ${className}`;

    return (
        <div className={containerClassName}>
            <FormLabel htmlFor={inputId} label={label} required={required} labelClassName={labelClassName} />
            <input
                id={inputId}
                className={finalInputClasses}
                {...inputProps}
            />
            <FormHelperText error={error} helperText={helperText} />
        </div>
    );
}

