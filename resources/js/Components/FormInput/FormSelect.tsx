import FormHelperText from './FormHelperText';
import FormLabel from './FormLabel';

export default function FormSelect({
    label,
    error,
    labelClassName = '',
    containerClassName = '',
    className = '',
    id,
    helperText,
    options,
    required,
    ...props
}: any) {
    const selectId = id || props.name;
    const { required: _, ...selectProps } = props;
    const baseSelectClasses = 'mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white';
    const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '';
    const finalSelectClasses = `${baseSelectClasses} ${errorClasses} ${className}`;

    return (
        <div className={containerClassName}>
            <FormLabel htmlFor={selectId} label={label} required={required} labelClassName={labelClassName} />
            <select
                id={selectId}
                className={finalSelectClasses}
                {...selectProps}
            >
                {options.map((option: any) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <FormHelperText error={error} helperText={helperText} />
        </div>
    );
}

