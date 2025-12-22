import FormHelperText from './FormHelperText';
import FormLabel from './FormLabel';

export default function FormCheckbox({
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
    const checkboxId = id || props.name;
    const { required: _, ...checkboxProps } = props;
    const baseCheckboxClasses = 'h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded';
    const finalCheckboxClasses = `${baseCheckboxClasses} ${className}`;

    return (
        <div className={containerClassName}>
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id={checkboxId}
                    className={finalCheckboxClasses}
                    {...checkboxProps}
                />
                <FormLabel htmlFor={checkboxId} label={label} required={required} labelClassName={labelClassName} variant="checkbox" />
            </div>
            <FormHelperText error={error} helperText={helperText} />
        </div>
    );
}

