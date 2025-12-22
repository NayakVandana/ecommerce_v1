import FormHelperText from './FormHelperText';
import FormLabel from './FormLabel';

export default function FormTextarea({
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
    const textareaId = id || props.name;
    const { required: _, ...textareaProps } = props;
    const baseTextareaClasses = 'mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm';
    const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '';
    const finalTextareaClasses = `${baseTextareaClasses} ${errorClasses} ${className}`;

    return (
        <div className={containerClassName}>
            <FormLabel htmlFor={textareaId} label={label} required={required} labelClassName={labelClassName} />
            <textarea
                id={textareaId}
                className={finalTextareaClasses}
                {...textareaProps}
            />
            <FormHelperText error={error} helperText={helperText} />
        </div>
    );
}

