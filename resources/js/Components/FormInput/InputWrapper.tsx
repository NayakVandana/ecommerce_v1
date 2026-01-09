import FormLabel from './FormLabel';
import FormHelperText from './FormHelperText';

export default function InputWrapper({
    title,
    label,
    error,
    helpertext,
    isRequired,
    id,
    children,
    containerClassName = '',
    labelClassName = '',
}: any) {
    const inputId = id || title || label;

    return (
        <div className={containerClassName}>
            {(title || label) && (
                <FormLabel 
                    htmlFor={inputId} 
                    label={title || label} 
                    required={isRequired} 
                    labelClassName={labelClassName} 
                />
            )}
            {children}
            <FormHelperText error={error} helperText={helpertext} />
        </div>
    );
}

